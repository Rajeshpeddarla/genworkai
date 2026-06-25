const JINA_API_KEY = process.env.JINA_API_KEY || 'jina_752b83045b5b444cb9f5edb05f8abaf5rKiQNEpS42_jN6L8AtqqqXD2DJlx';
const EMBEDDING_MODEL = 'jina-embeddings-v5-text-small';

/**
 * Generate an embedding for a piece of text using Jina AI
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const controller = new AbortController();
    // 30 second timeout per embedding to prevent hanging
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch('https://api.jina.ai/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JINA_API_KEY}`
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        task: 'retrieval.query',
        normalized: true,
        input: [text],
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Jina API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw error;
  }
}

/**
 * Rerank documents for a query using Jina AI
 */
export async function rerankDocuments(query: string, documents: string[], topN: number = 3): Promise<{ index: number, document: string, relevance_score: number }[]> {
  if (documents.length === 0) return [];
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch('https://api.jina.ai/v1/rerank', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JINA_API_KEY}`
      },
      body: JSON.stringify({
        model: 'jina-reranker-v3',
        query: query,
        top_n: topN,
        documents: documents,
        return_documents: false
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Jina Reranker API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error("Error reranking documents:", error);
    throw error;
  }
}

/**
 * Split text into roughly evenly sized chunks (naive approach)
 */
export function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
  const chunks: string[] = [];
  let i = 0;
  
  while (i < text.length) {
    chunks.push(text.slice(i, i + chunkSize));
    i += chunkSize - overlap;
  }
  
  return chunks;
}
