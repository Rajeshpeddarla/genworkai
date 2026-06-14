import { NextResponse } from 'next/server';
import { Client } from 'pg';
import { db } from '../../../../../db';
import { documents, documentChunks, knowledgeSources, syncJobs, sourceSnapshots } from '../../../../../db/schema';
import { generateEmbedding } from '../../../../../lib/embeddings';
import { enhanceTextWithAI, smartChunkMarkdown, extractRelationships } from '../../../../../lib/knowledge-pipeline';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: Request) {
  let pgClient: Client | null = null;
  try {
    const { connectionString, kbId, dbType = 'postgresql' } = await req.json();

    if (!connectionString || !kbId) {
      return NextResponse.json({ error: 'Connection string and kbId are required' }, { status: 400, headers: corsHeaders });
    }

    if (dbType !== 'postgresql') {
       return NextResponse.json({ error: 'Only PostgreSQL is supported in this V1 endpoint right now.' }, { status: 400, headers: corsHeaders });
    }

    // 1. Create or Update Source
    // DO NOT STORE THE PLAIN CONNECTION STRING in configuration. Store a sanitized version and we could store the real one securely, but for V1 we'll mock the encryption behavior by storing a placeholder and connecting immediately.
    // In a real implementation we'd use a KMS or vault for `encrypted_credentials`.
    const urlPattern = /postgres(?:ql)?:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
    const match = connectionString.match(urlPattern);
    const sanitizedUrl = match ? `postgres://${match[1]}:***@${match[3]}:${match[4]}/${match[5]}` : 'Secure DB Connection';

    const newSource = await db.insert(knowledgeSources).values({
      kbId: parseInt(kbId, 10),
      name: `Database: ${match ? match[5] : 'Unknown'}`,
      type: 'database',
      classification: { category: 'database', type: dbType, language: 'sql' },
      configuration: { sanitizedUrl },
      syncStatus: 'syncing'
    }).returning();
    const sourceId = newSource[0]!.id;

    // Create a Sync Job
    const syncJob = await db.insert(syncJobs).values({
      sourceId,
      status: 'processing',
      startedAt: new Date()
    }).returning();

    // 2. Connect to the DB
    pgClient = new Client({ connectionString, statement_timeout: 10000 });
    await pgClient.connect();

    // 3. Extract Schema
    const tablesRes = await pgClient.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    let schemaDefinition = `# Database Schema\n\n`;
    
    for (const row of tablesRes.rows) {
      const tableName = row.table_name;
      schemaDefinition += `## Table: ${tableName}\n`;
      
      const columnsRes = await pgClient.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
      `, [tableName]);
      
      schemaDefinition += `| Column | Type | Nullable |\n|---|---|---|\n`;
      for (const col of columnsRes.rows) {
        schemaDefinition += `| ${col.column_name} | ${col.data_type} | ${col.is_nullable} |\n`;
      }
      
      // Foreign Keys
      const fksRes = await pgClient.query(`
        SELECT
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
        FROM 
            information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
              AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = $1;
      `, [tableName]);
      
      if (fksRes.rows.length > 0) {
        schemaDefinition += `\n### Foreign Keys\n`;
        for (const fk of fksRes.rows) {
          schemaDefinition += `- ${fk.column_name} -> ${fk.foreign_table_name}(${fk.foreign_column_name})\n`;
        }
      }
      schemaDefinition += `\n---\n`;
    }

    // 4. Process the schema document
    const apiKey = process.env.CKEY_API_KEY || '';
    const enhancedData = apiKey ? await enhanceTextWithAI(schemaDefinition, apiKey, process.env.CKEY_API_URL) : {
      summary: "Database Schema Definition",
      topics: ["Database", "Schema", "Tables"],
      keywords: ["SQL", "Postgres", "Schema"],
      classification: "Database Schema",
      knowledgeContent: schemaDefinition,
      embeddingContent: schemaDefinition
    };

    const relationships = extractRelationships(schemaDefinition, 'database');

    const newDoc = await db.insert(documents).values({
      kbId: parseInt(kbId, 10),
      sourceId,
      title: 'Database Schema',
      sourceType: 'sql',
      sourceUrl: sanitizedUrl,
      content: schemaDefinition,
      summary: enhancedData.summary,
      topics: enhancedData.topics,
      keywords: enhancedData.keywords,
      classification: enhancedData.classification,
      knowledgeContent: enhancedData.knowledgeContent,
      embeddingContent: enhancedData.embeddingContent,
      sizeBytes: Buffer.byteLength(schemaDefinition, 'utf8'),
      metadata: { originalName: 'schema.sql', processingStrategy: "3-artifact", relationships }
    }).returning();

    const chunks = smartChunkMarkdown(enhancedData.embeddingContent || schemaDefinition);
    let embeddingsGenerated = 0;

    for (const chunk of chunks) {
      if (chunk.length < 5) continue;
      try {
        const vector = await generateEmbedding(chunk);
        await db.insert(documentChunks).values({
          documentId: newDoc[0]!.id,
          content: chunk,
          embedding: vector
        });
        embeddingsGenerated++;
      } catch (embedErr) {
        console.error("Failed to embed chunk:", embedErr);
      }
    }

    // Hash the schema to track changes
    const crypto = require('crypto');
    const schemaHash = crypto.createHash('sha256').update(schemaDefinition).digest('hex');

    await db.insert(sourceSnapshots).values({
      sourceId,
      hash: schemaHash,
      metadata: { tablesCount: tablesRes.rows.length }
    });

    await db.execute(
      require('drizzle-orm').sql`UPDATE knowledge_sources 
      SET files_processed = 1, 
          chunks_generated = ${chunks.length}, 
          embeddings_generated = ${embeddingsGenerated},
          document_count = 1,
          chunk_count = ${chunks.length},
          latest_hash = ${schemaHash},
          last_sync_at = NOW(),
          last_successful_sync_at = NOW(),
          sync_status = 'success'
      WHERE id = ${sourceId}`
    );

    await db.execute(
      require('drizzle-orm').sql`UPDATE sync_jobs
      SET status = 'completed', finished_at = NOW()
      WHERE id = ${syncJob[0]!.id}`
    );

    await pgClient.end();

    return NextResponse.json({ success: true, sourceId, tablesProcessed: tablesRes.rows.length }, { headers: corsHeaders });

  } catch (error: any) {
    if (pgClient) {
      await pgClient.end().catch(() => {});
    }
    console.error('Database Import error:', error);
    return NextResponse.json({ error: error.message || 'Failed to import Database schema' }, { status: 500, headers: corsHeaders });
  }
}
