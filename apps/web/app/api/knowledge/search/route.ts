import { NextResponse } from 'next/server';
import { db } from '../../../../db';
import { documentChunks, documents } from '../../../../db/schema';
import { generateEmbedding } from '../../../../lib/embeddings';
import { cosineDistance, desc, eq } from 'drizzle-orm';
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

    const ownershipError = await requireOwnership('knowledge_base', parseInt(kbId, 10), user.id);
    if (ownershipError) return ownershipError;

    if (!process.env.DATABASE_URL) {
      throw new Error('Database is not configured. Please set DATABASE_URL.');
    }

    // 1. Generate embedding for the search query
    const queryVector = await generateEmbedding(query);

    // 2. Perform vector search in the database (Top 5 chunks)
    // pgvector supports <-> (L2 distance), <#> (negative inner product), and <=> (cosine distance)
    const similarity = cosineDistance(documentChunks.embedding, queryVector);

    const results = await db
      .select({
        content: documentChunks.content,
        documentTitle: documents.title,
        sourceType: documents.sourceType,
        sourceContent: documents.content,
        knowledgeContent: documents.knowledgeContent,
        similarity
      })
      .from(documentChunks)
      .innerJoin(documents, eq(documentChunks.documentId, documents.id))
      .where(eq(documents.kbId, parseInt(kbId, 10)))
      .orderBy(similarity) // Ascending order because distance metric is smaller for more similar items
      .limit(5);

    return NextResponse.json({ results });
  } catch (error: unknown) {
    return safeErrorResponse(error, 'Knowledge Search Route');
  }
}
