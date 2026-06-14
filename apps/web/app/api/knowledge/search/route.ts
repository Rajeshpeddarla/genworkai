import { NextResponse } from 'next/server';
import { db } from '../../../../db';
import { documentChunks, documents } from '../../../../db/schema';
import { generateEmbedding } from '../../../../lib/embeddings';
import { cosineDistance, desc, eq } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const { query, kbId } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'Database is not configured. Please set DATABASE_URL.' }, { status: 500 });
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
  } catch (error: any) {
    console.error('Knowledge Search error:', error);
    return NextResponse.json({ error: error.message || 'Failed to perform search' }, { status: 500 });
  }
}
