import { NextResponse } from 'next/server';
import { db } from '../../../../db';
import { documentChunks, documents, mcpApiKeys, mcpServers } from '../../../../db/schema';
import { generateEmbedding } from '../../../../lib/embeddings';
import { cosineDistance, eq } from 'drizzle-orm';
import crypto from 'crypto';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// Example MCP / REST Endpoint for External Agents
export async function POST(req: Request) {
  try {
    const apiKeyHeader = req.headers.get('x-api-key');
    if (!apiKeyHeader) {
      return NextResponse.json({ error: 'Unauthorized. Missing API Key.' }, { status: 401, headers: corsHeaders });
    }

    const { query, kbId, limit = 5 } = await req.json();

    if (!query || !kbId) {
      return NextResponse.json({ error: 'Query and kbId are required' }, { status: 400, headers: corsHeaders });
    }

    // Hash the provided API key to check against database
    const keyHash = crypto.createHash('sha256').update(apiKeyHeader).digest('hex');

    const keys = await db.select().from(mcpApiKeys).where(eq(mcpApiKeys.keyHash, keyHash)).limit(1);
    const validKey = keys[0];

    if (!validKey) {
      return NextResponse.json({ error: 'Unauthorized. Invalid API Key.' }, { status: 401, headers: corsHeaders });
    }

    // Verify the server has access to this kbId
    const servers = await db.select().from(mcpServers).where(eq(mcpServers.id, validKey.serverId!)).limit(1);
    const server = servers[0];

    if (!server || !server.kbIds || !Array.isArray(server.kbIds) || !server.kbIds.includes(parseInt(kbId, 10))) {
      return NextResponse.json({ error: 'Forbidden. Server does not have access to this Knowledge Base.' }, { status: 403, headers: corsHeaders });
    }

    // 2. Generate embedding for the search query
    const queryVector = await generateEmbedding(query);

    // 3. Perform vector search in the database
    const similarity = cosineDistance(documentChunks.embedding, queryVector);

    const results = await db
      .select({
        content: documentChunks.content,
        documentTitle: documents.title,
        sourceType: documents.sourceType,
        sourceUrl: documents.sourceUrl,
        knowledgeContent: documents.knowledgeContent,
      })
      .from(documentChunks)
      .innerJoin(documents, eq(documentChunks.documentId, documents.id))
      .where(eq(documents.kbId, parseInt(kbId, 10)))
      .orderBy(similarity)
      .limit(parseInt(limit, 10));

    // 4. Format strictly for LLM tool consumption
    const formattedContext = results.map((r: any, i: number) => `
[Result ${i + 1}]
Title: ${r.documentTitle}
Source: ${r.sourceUrl || r.sourceType}
---
${r.content}
---
Knowledge Base Summary:
${typeof r.knowledgeContent === 'string' ? r.knowledgeContent.substring(0, 500) : ''}...
`).join('\n\n');

    return NextResponse.json({ 
      success: true,
      query,
      count: results.length,
      formattedContext,
      rawResults: results 
    }, { headers: corsHeaders });

  } catch (error: any) {
    console.error('MCP Search error:', error);
    return NextResponse.json({ error: error.message || 'Failed to perform MCP search' }, { status: 500, headers: corsHeaders });
  }
}
