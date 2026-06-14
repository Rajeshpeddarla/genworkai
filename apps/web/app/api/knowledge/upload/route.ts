import { NextResponse } from 'next/server';
import { db } from '../../../../db';
import { documents, documentChunks, knowledgeSources } from '../../../../db/schema';
import { generateEmbedding } from '../../../../lib/embeddings';
import { extractTextFromBuffer, cleanExtractedText, enhanceTextWithAI, smartChunkMarkdown, extractRelationships } from '../../../../lib/knowledge-pipeline';

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
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const kbIdStr = formData.get('kbId') as string | null;
    const sourceIdStr = formData.get('sourceId') as string | null;
    
    const url = new URL(req.url);
    const skipEnhance = url.searchParams.get('skipEnhance') === 'true';

    if (!file || !kbIdStr) {
      return NextResponse.json({ error: 'File and kbId are required' }, { status: 400, headers: corsHeaders });
    }

    const kbId = parseInt(kbIdStr, 10);
    let sourceId = sourceIdStr ? parseInt(sourceIdStr, 10) : null;
    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type;
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';

    const { cookies } = require('next/headers');
    const { createServerClient } = require('@supabase/ssr');
    const { checkContextLimit } = require('../../../../lib/limits');

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const contextLimit = await checkContextLimit(user.id);
    if (!contextLimit.allowed || contextLimit.current + buffer.length > contextLimit.limit) {
      return NextResponse.json(
        { error: `Context limit reached. You can only upload up to ${(contextLimit.limit / 1000000).toFixed(1)}MB of data on the free plan.` }, 
        { status: 403, headers: corsHeaders }
      );
    }

    // If no sourceId is provided, create a default "Files" source for this KB
    if (!sourceId) {
      let filesSource = await db.query.knowledgeSources.findFirst({
        where: (sources, { eq, and }) => and(eq(sources.kbId, kbId), eq(sources.type, 'file'))
      });
      if (!filesSource) {
        const newSource = await db.insert(knowledgeSources).values({
          kbId,
          name: 'Direct Uploads',
          type: 'file',
          classification: { category: 'documents', type: 'files', language: 'mixed' }
        }).returning();
        filesSource = newSource[0];
      }
      sourceId = filesSource!.id;
    }

    // Pipeline Step 1: Extraction
    const extractedText = await extractTextFromBuffer(buffer, mimeType, file.name);
    
    if (!extractedText || extractedText.length < 10) {
      return NextResponse.json({ error: "Not enough text could be extracted." }, { status: 400, headers: corsHeaders });
    }

    // Pipeline Step 2: Cleaning
    const cleanedText = cleanExtractedText(extractedText);

    // Pipeline Step 3 & 4: Normalization & AI Enhancement
    const apiKey = process.env.CKEY_API_KEY || '';
    const enhancedData = (apiKey && !skipEnhance) ? await enhanceTextWithAI(cleanedText, apiKey, process.env.CKEY_API_URL) : {
      summary: "",
      topics: [],
      keywords: [],
      classification: "Unclassified",
      knowledgeContent: cleanedText,
      embeddingContent: cleanedText
    };

    // Extract relationships based on file type
    let relType: 'flutter' | 'dotnet' | 'database' | 'openapi' | 'unknown' = 'unknown';
    if (fileExtension === 'dart') relType = 'flutter';
    else if (fileExtension === 'cs') relType = 'dotnet';
    else if (fileExtension === 'sql') relType = 'database';
    else if (file.name.includes('swagger') || file.name.includes('openapi')) relType = 'openapi';
    
    const relationships = extractRelationships(cleanedText, relType);

    // Pipeline Step 5: Save Document
    const newDoc = await db.insert(documents).values({
      kbId,
      sourceId,
      title: file.name,
      sourceType: fileExtension || 'unknown',
      sourceUrl: file.name,
      content: cleanedText,
      summary: enhancedData.summary,
      topics: enhancedData.topics,
      keywords: enhancedData.keywords,
      classification: enhancedData.classification,
      knowledgeContent: enhancedData.knowledgeContent,
      embeddingContent: enhancedData.embeddingContent,
      sizeBytes: buffer.length,
      metadata: { 
        mimeType, 
        originalName: file.name, 
        processingStrategy: "3-artifact",
        relationships 
      }
    }).returning();

    // Pipeline Step 6: Chunking
    const chunks = smartChunkMarkdown(enhancedData.embeddingContent || cleanedText);
    const MAX_CHUNKS = 150;
    const processableChunks = chunks.slice(0, MAX_CHUNKS);
    
    // Pipeline Step 7: Embeddings
    let embeddingsGenerated = 0;
    for (const chunk of processableChunks) {
      if (req.signal.aborted) {
        console.warn("Client aborted request. Stopping embeddings.");
        break;
      }
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

    // Update Source Statistics
    if (sourceId) {
      await db.execute(
        require('drizzle-orm').sql`UPDATE knowledge_sources 
        SET files_processed = files_processed + 1, 
            chunks_generated = chunks_generated + ${chunks.length}, 
            embeddings_generated = embeddings_generated + ${embeddingsGenerated},
            document_count = document_count + 1,
            chunk_count = chunk_count + ${chunks.length},
            last_sync_at = NOW(),
            last_successful_sync_at = NOW()
        WHERE id = ${sourceId}`
      );
    }

    return NextResponse.json({ success: true, document: newDoc[0] }, { headers: corsHeaders });

  } catch (error: any) {
    console.error('KB Upload error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process file' }, { status: 500, headers: corsHeaders });
  }
}
