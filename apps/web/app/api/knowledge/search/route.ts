import { NextResponse } from 'next/server';
import { db } from '../../../../db';
import { documentChunks, documents, documentEmbeddings, semanticCache } from '../../../../db/schema';
import { generateEmbedding, rerankDocuments } from '../../../../lib/embeddings';
import { sql, eq } from 'drizzle-orm';
import { requireUser, requireOwnership } from '../../../../lib/auth';
import { safeErrorResponse, ValidationError } from '../../../../lib/errors';
import crypto from 'crypto';

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

    // 0. Check Semantic Cache
    const queryHash = crypto.createHash('sha256').update(query.toLowerCase().trim()).digest('hex');
    const cachedResponse = await db.query.semanticCache.findFirst({
      where: (cache, { eq, and }) => and(eq(cache.kbId, kbIdInt), eq(cache.queryHash, queryHash))
    });

    if (cachedResponse) {
      // Async update hit count
      db.execute(sql`UPDATE semantic_cache SET hit_count = hit_count + 1, last_hit_at = NOW() WHERE id = ${cachedResponse.id}`).catch(console.error);
      return NextResponse.json({ results: cachedResponse.response, cached: true });
    }

    // 1. Generate embedding for the search query
    const queryVector = await generateEmbedding(query);
    const queryVectorString = `[${queryVector.join(',')}]`;

    // 2. Perform Hybrid Search (Vector + Keyword BM25) using RRF with V3 Schema
    const searchSql = sql`
      WITH vector_search AS (
        SELECT c.id, e.vector <=> ${queryVectorString}::vector as distance,
               ROW_NUMBER() OVER (ORDER BY e.vector <=> ${queryVectorString}::vector ASC) as vector_rank
        FROM document_chunks c
        JOIN document_embeddings e ON e.chunk_id = c.id
        JOIN documents d ON d.id = c.document_id
        WHERE d.kb_id = ${kbIdInt}
        ORDER BY distance ASC
        LIMIT 20
      ),
      keyword_search AS (
        SELECT c.id, 
               ts_rank(
                 setweight(to_tsvector('english', COALESCE(d.title, '')), 'A') || 
                 setweight(to_tsvector('english', COALESCE(c.content, '')), 'B'), 
                 to_tsquery('english', NULLIF(array_to_string(regexp_split_to_array(trim(regexp_replace(${query}, '[^a-zA-Z0-9 ]', '', 'g')), '\\s+'), ' | '), ''))
               ) as bm25_rank,
               ROW_NUMBER() OVER (
                 ORDER BY ts_rank(
                   setweight(to_tsvector('english', COALESCE(d.title, '')), 'A') || 
                   setweight(to_tsvector('english', COALESCE(c.content, '')), 'B'), 
                   to_tsquery('english', NULLIF(array_to_string(regexp_split_to_array(trim(regexp_replace(${query}, '[^a-zA-Z0-9 ]', '', 'g')), '\\s+'), ' | '), ''))
                 ) DESC
               ) as keyword_rank
        FROM document_chunks c
        JOIN documents d ON d.id = c.document_id
        WHERE d.kb_id = ${kbIdInt}
          AND (
            setweight(to_tsvector('english', COALESCE(d.title, '')), 'A') || 
            setweight(to_tsvector('english', COALESCE(c.content, '')), 'B')
          ) @@ to_tsquery('english', NULLIF(array_to_string(regexp_split_to_array(trim(regexp_replace(${query}, '[^a-zA-Z0-9 ]', '', 'g')), '\\s+'), ' | '), ''))
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
        c.id as "chunkId",
        c.content,
        c.page_number as "pageNumber",
        c.bounding_box as "boundingBox",
        d.id as "documentId",
        d.title as "documentTitle",
        d.source_type as "sourceType",
        p.image_storage_key as "imageStorageKey",
        r.rrf_score as "similarity"
      FROM rrf r
      JOIN document_chunks c ON c.id = r.chunk_id
      JOIN documents d ON d.id = c.document_id
      LEFT JOIN document_pages p ON p.document_id = d.id AND p.page_number = c.page_number
      ORDER BY r.rrf_score DESC
      LIMIT 20
    `;

    const { rows } = await db.execute(searchSql);

    let finalResults = rows;
    
    // 3. Enrich with Knowledge Graph Nodes
    let enrichedGraphNodes: any[] = [];
    try {
      const graphSql = sql`
        SELECT 
          id, name, type, description,
          ts_rank(
            setweight(to_tsvector('english', COALESCE(name, '')), 'A') || 
            setweight(to_tsvector('english', COALESCE(description, '')), 'B'),
            to_tsquery('english', NULLIF(array_to_string(regexp_split_to_array(trim(regexp_replace(${query}, '[^a-zA-Z0-9 ]', '', 'g')), '\\s+'), ' | '), ''))
          ) as rank
        FROM knowledge_nodes
        WHERE kb_id = ${kbIdInt}
          AND (
            setweight(to_tsvector('english', COALESCE(name, '')), 'A') || 
            setweight(to_tsvector('english', COALESCE(description, '')), 'B')
          ) @@ to_tsquery('english', NULLIF(array_to_string(regexp_split_to_array(trim(regexp_replace(${query}, '[^a-zA-Z0-9 ]', '', 'g')), '\\s+'), ' | '), ''))
        ORDER BY rank DESC
        LIMIT 5
      `;
      const { rows: graphRows } = await db.execute(graphSql);
      enrichedGraphNodes = graphRows;
    } catch (e) {
      console.error("Knowledge Graph enrichment failed:", e);
    }

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

    // 3. Cache the results for future lookups
    if (finalResults.length > 0) {
      await db.insert(semanticCache).values({
        kbId: kbIdInt,
        queryHash,
        queryText: query,
        response: finalResults
      }).onConflictDoNothing(); // Ignore if it was inserted concurrently
    }

    // Check if Vision Routing is needed
    // Simple heuristic: Does the query mention images/diagrams or do the top chunks have visual pages?
    const needsVision = query.match(/image|diagram|figure|chart|graph|circuit|table/i) || 
                        finalResults.some(r => r.imageStorageKey != null);

    return NextResponse.json({ results: finalResults, graphNodes: enrichedGraphNodes, cached: false, needsVision });
  } catch (error: unknown) {
    return safeErrorResponse(error, 'Knowledge Search Route');
  }
}
