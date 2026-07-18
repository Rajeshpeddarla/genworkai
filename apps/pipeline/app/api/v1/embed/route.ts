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

    // Plan check for Embeddings (Pro/Enterprise only)
    const planRes = await client.query(`
      SELECT p.name 
      FROM baseparse_user_plans up
      LEFT JOIN baseparse_pricing_plans p ON p.id = up.plan_id
      WHERE up.user_id = $1
    `, [userId]);

    const planName = planRes.rows[0]?.name?.toLowerCase() || 'free';
    if (planName !== 'pro' && planName !== 'enterprise') {
      await client.end();
      return NextResponse.json({ error: "Embeddings are only available on Pro and Enterprise plans." }, { status: 403 });
    }

    const { documentId, chunks } = await request.json();

    if (!documentId || !chunks || !Array.isArray(chunks)) {
      await client.end();
      return NextResponse.json({ error: "documentId and chunks array are required" }, { status: 400 });
    }

    // Process embeddings in batches to avoid rate limits
    const embeddingsToInsert = [];
    
    // We use text-embedding-004 as the optimal zero-infrastructure embedding solution
    // It's vastly more reliable in Node.js than attempting to run ONNX/BAAI locally.
    for (const chunk of chunks) {
      try {
        const response = await ai.models.embedContent({
          model: "text-embedding-004",
          contents: chunk.content,
        });

        // The API returns an array of values for the embedding vector
        const vector = response.embeddings?.[0]?.values;
        
        if (vector) {
           embeddingsToInsert.push({
             documentId,
             userId,
             content: chunk.content,
             metadata: chunk.metadata || {},
             vector: `[${vector.join(',')}]` // Format for pgvector
           });
        }
      } catch (err) {
        console.warn(`Failed to embed chunk:`, err);
      }
    }

    // Bulk insert into Postgres
    let insertedCount = 0;
    for (const item of embeddingsToInsert) {
      try {
         await client.query(`
           INSERT INTO baseparse_embeddings (document_id, user_id, content, metadata, embedding)
           VALUES ($1, $2, $3, $4, $5)
         `, [item.documentId, item.userId, item.content, JSON.stringify(item.metadata), item.vector]);
         insertedCount++;
      } catch (insertErr: any) {
         // If vector extension isn't enabled, we can't insert vector type.
         console.error("Insert error (ensure pgvector is enabled):", insertErr.message);
      }
    }

    await client.end();

    return NextResponse.json({ 
      success: true, 
      processedChunks: insertedCount,
      totalRequested: chunks.length
    });

  } catch (error: any) {
    console.error("Embed error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
