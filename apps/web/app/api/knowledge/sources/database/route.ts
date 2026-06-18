import { NextResponse } from 'next/server';
import { db } from '../../../../../db';
import { documents, documentChunks, knowledgeSources, syncJobs, sourceSnapshots, connectedDatabases, databaseSchemas } from '../../../../../db/schema';
import { generateEmbedding } from '../../../../../lib/embeddings';
import { enhanceTextWithAI, smartChunkMarkdown, extractRelationships } from '../../../../../lib/knowledge-pipeline';
import { DatabaseService, DBConnectionConfig } from '../../../../../lib/database/DatabaseService';
import { requireUser, requireOwnership } from '../../../../../lib/auth';
import { safeErrorResponse, ValidationError } from '../../../../../lib/errors';
import { encryptSecret } from '../../../../../lib/security/encryption';
import { RateLimitService } from '../../../../../lib/security/rate-limit';

export async function POST(req: Request) {
  try {
    // 1. Authentication & Rate Limiting
    const { user, error } = await requireUser();
    if (error) return error;

    const rateLimitResponse = await RateLimitService.check(user.id, 'database');
    if (rateLimitResponse) return rateLimitResponse;

    const body = await req.json();
    const { connectionString, host, port, database, databaseName, username, password, engine = 'pg', kbId } = body;
    
    if (!kbId) {
      throw new ValidationError('Knowledge Base ID (kbId) is required');
    }

    const finalDatabaseName = databaseName || database;
    const targetKbId = parseInt(kbId, 10);
    
    // 2. Ownership Verification
    const ownershipError = await requireOwnership('knowledge_base', targetKbId, user.id);
    if (ownershipError) return ownershipError;

    const config: DBConnectionConfig = {
      engine, connectionString, host, port, database: finalDatabaseName, username, password
    };

    const dbService = new DatabaseService(config);
    const isConnected = await dbService.testConnection();

    if (!isConnected) {
      throw new ValidationError('Failed to connect to the database. Check credentials.');
    }

    // Encrypt sensitive credentials before storing
    const encryptedConnectionString = connectionString ? encryptSecret(connectionString) : null;
    const encryptedPassword = password ? encryptSecret(password) : null;

    // 1. Create Connected Database Record
    const newDb = await db.insert(connectedDatabases).values({
      kbId: targetKbId,
      name: `Database: ${finalDatabaseName || 'Custom'}`,
      engine,
      connectionString: encryptedConnectionString,
      host, port, databaseName: finalDatabaseName, username, password: encryptedPassword,
      accessMode: 'read_only'
    }).returning();
    const connectedDbId = newDb[0]!.id;

    // 2. Extract Schema
    const rawSchema = await dbService.extractSchema();

    // 3. Cache the raw schema
    await db.insert(databaseSchemas).values({
      databaseId: connectedDbId,
      schemaData: rawSchema
    });

    // 4. Create or Update Knowledge Source
    const newSource = await db.insert(knowledgeSources).values({
      kbId: targetKbId,
      name: `Database: ${finalDatabaseName || 'Custom'}`,
      type: 'database',
      classification: { category: 'database', type: engine, language: 'sql' },
      configuration: { connectedDbId }, // Link to secure credentials
      syncStatus: 'syncing'
    }).returning();
    const sourceId = newSource[0]!.id;

    // Create a Sync Job
    const syncJob = await db.insert(syncJobs).values({
      sourceId,
      status: 'processing',
      startedAt: new Date()
    }).returning();

    // 5. Convert Schema to Markdown for Knowledge Base
    let schemaDefinition = `# Database Schema (${engine})\n\n`;
    if (engine === 'mongodb') {
      schemaDefinition += `## Collections\n`;
      for (const coll of rawSchema.collections || []) {
        schemaDefinition += `- ${coll}\n`;
      }
    } else {
      for (const [tableName, columns] of Object.entries(rawSchema)) {
        schemaDefinition += `## Table: ${tableName}\n| Column | Type |\n|---|---|\n`;
        for (const col of columns as any[]) {
          schemaDefinition += `| ${col.column} | ${col.type} |\n`;
        }
        schemaDefinition += `\n---\n`;
      }
    }

    // 6. Process the schema document
    const apiKey = process.env.CKEY_API_KEY || '';
    const enhancedData = apiKey ? await enhanceTextWithAI(schemaDefinition, apiKey, process.env.CKEY_API_URL) : {
      summary: "Database Schema Definition",
      topics: ["Database", "Schema", "Tables"],
      keywords: ["SQL", "Database", "Schema"],
      classification: "Database Schema",
      knowledgeContent: schemaDefinition,
      embeddingContent: schemaDefinition
    };

    const relationships = extractRelationships(schemaDefinition, 'database');

    const newDoc = await db.insert(documents).values({
      kbId: targetKbId,
      sourceId,
      title: 'Database Schema',
      sourceType: 'sql',
      sourceUrl: `db://${engine}/${finalDatabaseName}`,
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
        console.error("Failed to embed chunk (Ollama might not be running). Skipping remaining chunks:", embedErr);
        break; // Stop trying to embed if the model/server is unreachable to prevent long timeouts
      }
    }

    // Hash the schema to track changes
    const crypto = require('crypto');
    const schemaHash = crypto.createHash('sha256').update(schemaDefinition).digest('hex');

    await db.insert(sourceSnapshots).values({
      sourceId,
      hash: schemaHash,
      metadata: { tablesCount: Object.keys(rawSchema).length }
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

    return NextResponse.json({ success: true, sourceId, connectedDbId });

  } catch (error: unknown) {
    return safeErrorResponse(error, 'Database Source Route');
  }
}

