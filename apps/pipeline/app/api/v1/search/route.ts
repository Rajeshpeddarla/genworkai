import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Client } from "pg";
import { GoogleGenAI } from "@google/genai";
import crypto from "crypto";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    let userId = null;
    const authHeader = request.headers.get("authorization");
    const connectionString = process.env.DATABASE_URL;
      
    if (!connectionString) {
      return NextResponse.json({ error: "Database misconfiguration" }, { status: 500 });
    }

    const client = new Client({ connectionString });
    await client.connect();

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const keyHash = crypto.createHash('sha256').update(token).digest('hex');
      const res = await client.query('SELECT id, user_id FROM baseparse_api_keys WHERE key_hash = $1 AND status = $2', [keyHash, 'active']);
      if (res.rows.length > 0) {
        userId = res.rows[0].user_id;
      }
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) userId = user.id;
    }

    if (!userId) {
      await client.end();
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    // Plan check for Search API (Enterprise only)
    const planRes = await client.query(`
      SELECT p.name 
      FROM baseparse_user_plans up
      LEFT JOIN baseparse_pricing_plans p ON p.id = up.plan_id
      WHERE up.user_id = $1
    `, [userId]);

    const planName = planRes.rows[0]?.name?.toLowerCase() || 'free';
    if (planName !== 'enterprise') {
      await client.end();
      return NextResponse.json({ error: "The Search API is exclusively available on the Enterprise plan." }, { status: 403 });
    }

    const { query, documentId, limit = 5 } = await request.json();

    if (!query) {
      await client.end();
      return NextResponse.json({ error: "Search query is required" }, { status: 400 });
    }

    // 1. Generate embedding for the search query
    const response = await ai.models.embedContent({
      model: "text-embedding-004",
      contents: query,
    });

    const queryVector = response.embeddings?.[0]?.values;
    
    if (!queryVector) {
       await client.end();
       return NextResponse.json({ error: "Failed to generate query embedding" }, { status: 500 });
    }

    // 2. Perform Vector Search (Cosine Similarity)
    let searchResult;
    if (documentId) {
      // Search within specific document
      searchResult = await client.query(`
        SELECT id, document_id, content, metadata, 1 - (embedding <=> $1::vector) as similarity
        FROM baseparse_embeddings
        WHERE user_id = $2 AND document_id = $3
        ORDER BY embedding <=> $1::vector
        LIMIT $4
      `, [`[${queryVector.join(',')}]`, userId, documentId, limit]);
    } else {
      // Search across all user documents (Workspace Intelligence)
      searchResult = await client.query(`
        SELECT id, document_id, content, metadata, 1 - (embedding <=> $1::vector) as similarity
        FROM baseparse_embeddings
        WHERE user_id = $2
        ORDER BY embedding <=> $1::vector
        LIMIT $3
      `, [`[${queryVector.join(',')}]`, userId, limit]);
    }

    await client.end();

    return NextResponse.json({ 
      results: searchResult.rows.map(row => ({
        id: row.id,
        documentId: row.document_id,
        content: row.content,
        metadata: row.metadata,
        score: row.similarity
      }))
    });

  } catch (error: any) {
    console.error("Search error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
