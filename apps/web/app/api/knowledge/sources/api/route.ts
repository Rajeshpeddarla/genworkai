import { NextResponse } from 'next/server';
import { db } from '../../../../../db';
import { documents, documentChunks, knowledgeSources, syncJobs, sourceSnapshots } from '../../../../../db/schema';
import { generateEmbedding } from '../../../../../lib/embeddings';
import { enhanceTextWithAI, smartChunkMarkdown, extractRelationships } from '../../../../../lib/knowledge-pipeline';
import { eq, and } from 'drizzle-orm';
import { requireUser, requireOwnership } from '../../../../../lib/auth';
import { safeErrorResponse, ValidationError } from '../../../../../lib/errors';
import { validateUrl } from '../../../../../lib/security/url-validator';
import { RateLimitService } from '../../../../../lib/security/rate-limit';

export async function POST(req: Request) {
  try {
    // 1. Authentication & Rate Limiting
    const { user, error } = await requireUser();
    if (error) return error;

    const rateLimitResponse = await RateLimitService.check(user.id, 'upload');
    if (rateLimitResponse) return rateLimitResponse;

    const { url, kbId } = await req.json();

    if (!url || !kbId) {
      throw new ValidationError('OpenAPI URL and kbId are required');
    }

    const targetKbId = parseInt(kbId, 10);

    // 2. Ownership Verification
    const ownershipError = await requireOwnership('knowledge_base', targetKbId, user.id);
    if (ownershipError) return ownershipError;

    // 3. SSRF Validation
    const ssrfError = await validateUrl(url);
    if (ssrfError) {
      throw new ValidationError(`Invalid or unsafe URL: ${ssrfError}`);
    }

    // 4. Fetch OpenAPI Spec
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json, application/yaml, text/yaml, text/plain',
        'User-Agent': 'GenWorkAI-Knowledge-Bot/1.0 (+https://genworkai.com/bot)'
      }
    });

    if (!response.ok) {
      throw new ValidationError(`Failed to fetch API spec: ${response.statusText} (${response.status})`);
    }

    const specText = await response.text();
    let specFormat = 'json';
    try {
       JSON.parse(specText);
    } catch {
       specFormat = 'yaml';
    }

    // 2. Create or Update Source
    const existingSources = await db.select().from(knowledgeSources).where(
      and(
        eq(knowledgeSources.kbId, parseInt(kbId, 10)),
        eq(knowledgeSources.type, 'api')
      )
    ).limit(1);
    
    let existingSource = existingSources[0];

    let sourceId: number;
    const crypto = require('crypto');
    const specHash = crypto.createHash('sha256').update(specText).digest('hex');

    if (existingSource) {
      sourceId = existingSource.id;
      if (existingSource.latestHash === specHash) {
        return NextResponse.json({ message: 'No new API changes since last sync', sourceId });
      }
      await db.execute(
        require('drizzle-orm').sql`UPDATE knowledge_sources SET sync_status = 'syncing' WHERE id = ${sourceId}`
      );
    } else {
      const newSource = await db.insert(knowledgeSources).values({
        kbId: parseInt(kbId, 10),
        name: `API Spec: ${new URL(url).hostname}`,
        type: 'api',
        classification: { category: 'api', type: 'openapi', language: specFormat },
        configuration: { url },
        syncStatus: 'syncing',
        latestHash: specHash
      }).returning();
      sourceId = newSource[0]!.id;
    }

    // Create a Sync Job
    const syncJob = await db.insert(syncJobs).values({
      sourceId,
      status: 'processing',
      startedAt: new Date()
    }).returning();

    // 3. Process the extracted text
    const apiKey = process.env.CKEY_API_KEY || '';
    const enhancedData = apiKey ? await enhanceTextWithAI(specText, apiKey, process.env.CKEY_API_URL) : {
      summary: "OpenAPI Specification Document",
      topics: ["API", "Endpoints", "Models"],
      keywords: ["REST", "OpenAPI", "Swagger"],
      classification: "API Documentation",
      knowledgeContent: specText,
      embeddingContent: specText
    };

    const relationships = extractRelationships(specText, 'openapi');

    // 4. Save Document
    const newDoc = await db.insert(documents).values({
      kbId: parseInt(kbId, 10),
      sourceId,
      title: 'OpenAPI Specification',
      sourceType: specFormat,
      sourceUrl: url,
      content: specText,
      summary: enhancedData.summary,
      topics: enhancedData.topics,
      keywords: enhancedData.keywords,
      classification: enhancedData.classification,
      knowledgeContent: enhancedData.knowledgeContent,
      embeddingContent: enhancedData.embeddingContent,
      sizeBytes: Buffer.byteLength(specText, 'utf8'),
      metadata: { originalName: 'openapi.' + specFormat, processingStrategy: "3-artifact", relationships }
    }).returning();

    // 5. Generate Embeddings
    const chunks = smartChunkMarkdown(enhancedData.embeddingContent || specText);
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

    // Add Source Snapshot
    await db.insert(sourceSnapshots).values({
      sourceId,
      hash: specHash,
      metadata: { chunksGenerated: chunks.length }
    });

    // Update Source Statistics
    await db.execute(
      require('drizzle-orm').sql`UPDATE knowledge_sources 
      SET files_processed = files_processed + 1, 
          chunks_generated = chunks_generated + ${chunks.length}, 
          embeddings_generated = embeddings_generated + ${embeddingsGenerated},
          document_count = document_count + 1,
          chunk_count = chunk_count + ${chunks.length},
          latest_hash = ${specHash},
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

    return NextResponse.json({ success: true, sourceId });

  } catch (error: unknown) {
    return safeErrorResponse(error, 'API Spec Import Route');
  }
}
