import { NextResponse } from 'next/server';
import { db } from '../../../../db';
import { documentChunks, documents } from '../../../../db/schema';
import { generateEmbedding, rerankDocuments } from '../../../../lib/embeddings';
import { sql } from 'drizzle-orm';
import { requireUser, requireOwnership } from '../../../../lib/auth';
import { safeErrorResponse, ValidationError } from '../../../../lib/errors';

export async function POST(req: Request) {
  try {
    const { user, error } = await requireUser();
    if (error) return error;
    const { query, kbId } = await req.json();

    if (!query) {
      throw new ValidationError('Query is required');
    }

    if (!kbId) {
      throw new ValidationError('Knowledge Base ID is required');
    }

    const kbIdInt = parseInt(kbId, 10);

    const ownershipError = await requireOwnership('knowledge_base', kbIdInt, user.id);
    if (ownershipError) return ownershipError;

    if (!process.env.DATABASE_URL) {
      throw new Error('Database is not configured. Please set DATABASE_URL.');
    }

    // 1. Generate embedding for the search query
    const queryVector = await generateEmbedding(query);
    const queryVectorString = `[${queryVector.join(',')}]`;

    // 2. Perform Hybrid Search (Vector + Keyword BM25) using RRF
    const searchSql = sql`
      WITH vector_search AS (
        SELECT c.id, c.embedding <=> ${queryVectorString}::vector as distance,
               ROW_NUMBER() OVER (ORDER BY c.embedding <=> ${queryVectorString}::vector ASC) as vector_rank
        FROM document_chunks c
        JOIN documents d ON d.id = c.document_id
        WHERE d.kb_id = ${kbIdInt}
        ORDER BY distance ASC
        LIMIT 20
      ),
      keyword_search AS (
        SELECT c.id, ts_rank(to_tsvector('english', c.content), plainto_tsquery('english', ${query})) as bm25_rank,
               ROW_NUMBER() OVER (ORDER BY ts_rank(to_tsvector('english', c.content), plainto_tsquery('english', ${query})) DESC) as keyword_rank
        FROM document_chunks c
        JOIN documents d ON d.id = c.document_id
        WHERE d.kb_id = ${kbIdInt}
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
        d.content as "sourceContent",
        d.knowledge_content as "knowledgeContent",
        r.rrf_score as "similarity"
      FROM rrf r
      JOIN document_chunks c ON c.id = r.chunk_id
      JOIN documents d ON d.id = c.document_id
      ORDER BY r.rrf_score DESC
      LIMIT 20
    `;

    const { rows } = await db.execute(searchSql);

    let finalResults = rows;
    if (rows.length > 0) {
      const docsToRerank = rows.map((row: any) => row.content);
      try {
        const reranked = await rerankDocuments(query, docsToRerank, 5);
        finalResults = reranked.map(r => ({
          ...rows[r.index],
          similarity: r.relevance_score
        }));
      } catch (err) {
        console.error("Reranking failed, falling back to RRF results", err);
        finalResults = rows.slice(0, 5);
      }
    }

    return NextResponse.json({ results: finalResults });
  } catch (error: unknown) {
    return safeErrorResponse(error, 'Knowledge Search Route');
  }
}
