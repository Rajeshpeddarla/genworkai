import { NextResponse } from "next/server";
import { db } from "../../../../../../db";
import { knowledgeBases } from "../../../../../../db/schema";
import { sql, eq, and } from "drizzle-orm";
import { z } from "zod";
import { ApiAuthService } from "../../../../../../lib/auth/ApiAuthService";
import {
  generateEmbedding,
  rerankDocuments,
} from "../../../../../../lib/embeddings";
import { RateLimitService } from "../../../../../../lib/security/rate-limit";
import {
  safeErrorResponse,
  ValidationError,
} from "../../../../../../lib/errors";

const searchSchema = z.object({
  query: z.string().min(1, "Query is required"),
  limit: z.number().min(1).max(50).default(5),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ kbId: string }> },
) {
  const startTime = Date.now();
  let authResult;
  let metrics = { vector_searches: 0, requests: 1 };

  try {
    const p = await params;
    const kbIdStr = p.kbId;
    const kbId = parseInt(kbIdStr, 10);
    if (isNaN(kbId)) {
      throw new ValidationError("Invalid Knowledge Base ID");
    }

    // 1. Authenticate using the new API Gateway Service
    const authHeader = req.headers.get("authorization");
    authResult = await ApiAuthService.validateRequest(
      authHeader,
      "kb:read",
      "kb",
      kbId,
    );

    if (!authResult.isValid) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    // 2. Parse and Validate Payload
    const body = await req.json().catch(() => ({}));
    const parsed = searchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 },
      );
    }
    const { query, limit } = parsed.data;

    if (!authResult.isValid) {
      throw new ValidationError(authResult.error || "Unauthorized");
    }

    // 3. Rate Limit Enforcement
    // Check strict concurrency first (5 requests per second)
    const concurrentLimit = await RateLimitService.check(authResult.userId!, "v1_concurrent");
    if (concurrentLimit) return concurrentLimit;
    
    // Check volume limit (60 requests per minute)
    const rateLimit = await RateLimitService.checkWithInfo(authResult.userId!, "v1");
    if (rateLimit.response) return rateLimit.response;

    // 2. Validate KB Access
    const [kb] = await db
      .select()
      .from(knowledgeBases)
      .where(
        and(
          eq(knowledgeBases.id, kbId),
          eq(knowledgeBases.userId, authResult.userId!),
        ),
      );
    if (!kb) {
      throw new ValidationError("Knowledge base not found or access denied");
    }

    // 3. Generate query embedding
    const queryVector = await generateEmbedding(query);
    const queryVectorString = `[${queryVector.join(",")}]`;
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
      LIMIT 20
    `;

    const { rows } = await db.execute(searchSql);

    // 4.5 Rerank the top 20 results using Jina AI
    let finalResults = rows;
    if (rows.length > 0) {
      const docsToRerank = rows.map((row: any) => row.content);
      try {
        const reranked = await rerankDocuments(query, docsToRerank, limit);
        // Jina returns { index, document (if return_documents=true), relevance_score }
        // We set return_documents=false, so we use index to map back
        finalResults = reranked.map((r) => ({
          ...rows[r.index],
          similarity: r.relevance_score,
        }));
      } catch (err) {
        console.error("Reranking failed, falling back to RRF results", err);
        finalResults = rows.slice(0, limit);
      }
    }

    // 5. Log API usage asynchronously
    const durationMs = Date.now() - startTime;
    await ApiAuthService.logUsage({
      userId: authResult.userId!,
      apiKeyId: authResult.apiKeyId,
      endpoint: `/v1/kb/${kbId}/search`,
      resourceType: "kb",
      resourceId: kbId,
      status: 200,
      durationMs,
      metrics,
    });

    const response = NextResponse.json({ results: finalResults });
    if (rateLimit.info) {
      response.headers.set(
        "X-RateLimit-Limit",
        rateLimit.info.limit.toString(),
      );
      response.headers.set(
        "X-RateLimit-Remaining",
        rateLimit.info.remaining.toString(),
      );
      response.headers.set(
        "X-RateLimit-Reset",
        rateLimit.info.reset.toString(),
      );
    }

    return response;
  } catch (error: unknown) {
    const durationMs = Date.now() - startTime;
    if (authResult?.isValid) {
      await ApiAuthService.logUsage({
        userId: authResult.userId!,
        apiKeyId: authResult.apiKeyId,
        endpoint: `/v1/kb/${(await params).kbId}/search`,
        resourceType: "kb",
        resourceId: parseInt((await params).kbId, 10),
        status: error instanceof ValidationError ? 400 : 500,
        durationMs,
        metrics,
      });
    }
    return NextResponse.json(
      {
        error: "An unexpected error occurred.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
