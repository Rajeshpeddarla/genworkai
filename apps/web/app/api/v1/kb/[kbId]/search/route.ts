import { NextResponse } from 'next/server';
import { db } from '../../../../../../db';
import { sql } from 'drizzle-orm';
import { z } from 'zod';
import { ApiAuthService } from '../../../../../../lib/auth/ApiAuthService';
import { generateEmbedding } from '../../../../../../lib/embeddings';
import { safeErrorResponse, ValidationError } from '../../../../../../lib/errors';

const searchSchema = z.object({
  query: z.string().min(1, 'Query is required'),
  limit: z.number().min(1).max(50).default(5),
});

export async function POST(req: Request, { params }: { params: { kbId: string } }) {
  const startTime = Date.now();
  let authResult;
  let metrics = { vector_searches: 0, requests: 1 };

  try {
    const kbId = parseInt(params.kbId, 10);
    if (isNaN(kbId)) {
      throw new ValidationError('Invalid Knowledge Base ID');
    }

    // 1. Authenticate using the new API Gateway Service
    const authHeader = req.headers.get('authorization');
    authResult = await ApiAuthService.validateRequest(authHeader, 'kb:read', 'kb', kbId);
    
    if (!authResult.isValid) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    // 2. Parse and Validate Payload
    const body = await req.json().catch(() => ({}));
    const parsed = searchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.issues }, { status: 400 });
    }
    const { query, limit } = parsed.data;

    // 3. Generate query embedding
    const queryVector = await generateEmbedding(query);
    const queryVectorString = `[${queryVector.join(',')}]`;
    metrics.vector_searches += 1;

    // 4. Execute Hybrid Search (Vector + BM25)
    const searchSql = sql`
      WITH vector_search AS (
        SELECT c.id, c.embedding <=> ${queryVectorString}::vector as distance,
               ROW_NUMBER() OVER (ORDER BY c.embedding <=> ${queryVectorString}::vector ASC) as vector_rank
        FROM document_chunks c
        JOIN documents d ON d.id = c.document_id
        WHERE d.kb_id = ${kbId}
        ORDER BY distance ASC
        LIMIT 20
      ),
      keyword_search AS (
        SELECT c.id, ts_rank(to_tsvector('english', c.content), plainto_tsquery('english', ${query})) as bm25_rank,
               ROW_NUMBER() OVER (ORDER BY ts_rank(to_tsvector('english', c.content), plainto_tsquery('english', ${query})) DESC) as keyword_rank
        FROM document_chunks c
        JOIN documents d ON d.id = c.document_id
        WHERE d.kb_id = ${kbId}
          AND to_tsvector('english', c.content) @@ plainto_tsquery('english', ${query})
        ORDER BY bm25_rank DESC
        LIMIT 20
      ),
      rrf AS (
        SELECT 
          COALESCE(v.id, k.id) as chunk_id,
          (COALESCE(1.0 / (60 + v.vector_rank), 0.0) +
           COALESCE(1.0 / (60 + k.keyword_rank), 0.0)) as rrf_score
        FROM vector_search v
        FULL OUTER JOIN keyword_search k ON v.id = k.id
      )
      SELECT 
        c.content,
        d.title as "documentTitle",
        d.source_type as "sourceType",
        r.rrf_score as "similarity"
      FROM rrf r
      JOIN document_chunks c ON c.id = r.chunk_id
      JOIN documents d ON d.id = c.document_id
      ORDER BY r.rrf_score DESC
      LIMIT ${limit}
    `;

    const { rows } = await db.execute(searchSql);

    // 5. Log API usage asynchronously
    const durationMs = Date.now() - startTime;
    ApiAuthService.logUsage({
      userId: authResult.userId!,
      apiKeyId: authResult.apiKeyId,
      endpoint: `/v1/kb/${kbId}/search`,
      resourceType: 'kb',
      resourceId: kbId,
      status: 200,
      durationMs,
      metrics
    });

    return NextResponse.json({ results: rows });

  } catch (error: unknown) {
    const durationMs = Date.now() - startTime;
    if (authResult?.isValid) {
      ApiAuthService.logUsage({
        userId: authResult.userId!,
        apiKeyId: authResult.apiKeyId,
        endpoint: `/v1/kb/${params.kbId}/search`,
        resourceType: 'kb',
        resourceId: parseInt(params.kbId, 10),
        status: error instanceof ValidationError ? 400 : 500,
        durationMs,
        metrics
      });
    }
    return safeErrorResponse(error, 'V1 Knowledge Search');
  }
}
