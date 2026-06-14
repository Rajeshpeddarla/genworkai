import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { db } from '../../../../../db';
import { documents, documentChunks, knowledgeSources, syncJobs, sourceSnapshots } from '../../../../../db/schema';
import { generateEmbedding } from '../../../../../lib/embeddings';
import { enhanceTextWithAI, smartChunkMarkdown } from '../../../../../lib/knowledge-pipeline';
import { eq, and } from 'drizzle-orm';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: Request) {
  try {
    const { url, kbId } = await req.json();

    if (!url || !kbId) {
      return NextResponse.json({ error: 'URL and kbId are required' }, { status: 400, headers: corsHeaders });
    }

    // 1. Fetch Website Content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'GenWorkAI-Knowledge-Bot'
      }
    });

    if (!response.ok) {
      return NextResponse.json({ error: `Failed to fetch website: ${response.statusText}` }, { status: response.status, headers: corsHeaders });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove scripts, styles, and non-content elements
    $('script, style, noscript, iframe, nav, footer, header').remove();

    const title = $('title').text().trim() || url;
    let extractedText = $('body').text();
    extractedText = extractedText.replace(/\s+/g, ' ').trim();

    if (extractedText.length < 50) {
      return NextResponse.json({ error: 'Not enough readable content found on the page' }, { status: 400, headers: corsHeaders });
    }

    // 2. Create or Update Source
    const existingSources = await db.select().from(knowledgeSources).where(
      and(
        eq(knowledgeSources.kbId, parseInt(kbId, 10)),
        eq(knowledgeSources.type, 'website')
      )
    ).limit(1);
    let existingSource = existingSources[0];

    let sourceId: number;
    const crypto = require('crypto');
    const pageHash = crypto.createHash('sha256').update(extractedText).digest('hex');

    if (existingSource) {
      // In a real app we'd find the exact website source by URL. 
      // For V1, we just update the first one or create new.
      sourceId = existingSource.id;
      if (existingSource.latestHash === pageHash) {
        return NextResponse.json({ message: 'No new content since last sync', sourceId }, { headers: corsHeaders });
      }
      await db.execute(
        require('drizzle-orm').sql`UPDATE knowledge_sources SET sync_status = 'syncing' WHERE id = ${sourceId}`
      );
    } else {
      const newSource = await db.insert(knowledgeSources).values({
        kbId: parseInt(kbId, 10),
        name: `Website: ${new URL(url).hostname}`,
        type: 'website',
        classification: { category: 'documentation', type: 'website', language: 'mixed' },
        configuration: { url },
        syncStatus: 'syncing',
        latestHash: pageHash
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
    const enhancedData = apiKey ? await enhanceTextWithAI(extractedText, apiKey, process.env.CKEY_API_URL) : {
      summary: "Website Content",
      topics: [],
      keywords: [],
      classification: "Web Page",
      knowledgeContent: extractedText,
      embeddingContent: extractedText
    };

    // 4. Save Document
    const newDoc = await db.insert(documents).values({
      kbId: parseInt(kbId, 10),
      sourceId,
      title,
      sourceType: 'html',
      sourceUrl: url,
      content: extractedText,
      summary: enhancedData.summary,
      topics: enhancedData.topics,
      keywords: enhancedData.keywords,
      classification: enhancedData.classification,
      knowledgeContent: enhancedData.knowledgeContent,
      embeddingContent: enhancedData.embeddingContent,
      sizeBytes: Buffer.byteLength(extractedText, 'utf8'),
      metadata: { originalName: title, processingStrategy: "3-artifact", relationships: { related: [] } }
    }).returning();

    // 5. Generate Embeddings
    const chunks = smartChunkMarkdown(enhancedData.embeddingContent || extractedText);
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
      hash: pageHash,
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
          latest_hash = ${pageHash},
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

    return NextResponse.json({ success: true, sourceId, title }, { headers: corsHeaders });

  } catch (error: any) {
    console.error('Website Import error:', error);
    return NextResponse.json({ error: error.message || 'Failed to scrape website' }, { status: 500, headers: corsHeaders });
  }
}
