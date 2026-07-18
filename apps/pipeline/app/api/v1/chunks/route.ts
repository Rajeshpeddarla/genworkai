import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Client } from "pg";
import crypto from "crypto";
import { GoogleGenAI } from "@google/genai";

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

    // Plan check for Chunks (Pro/Enterprise only)
    const planRes = await client.query(`
      SELECT p.name 
      FROM baseparse_user_plans up
      LEFT JOIN baseparse_pricing_plans p ON p.id = up.plan_id
      WHERE up.user_id = $1
    `, [userId]);

    const planName = planRes.rows[0]?.name?.toLowerCase() || 'free';
    if (planName !== 'pro' && planName !== 'enterprise') {
      await client.end();
      return NextResponse.json({ error: "Semantic Chunks API is only available on Pro and Enterprise plans." }, { status: 403 });
    }

    const { text, strategy = "semantic" } = await request.json();

    if (!text) {
      await client.end();
      return NextResponse.json({ error: "Text content is required" }, { status: 400 });
    }

    // Generate semantic chunks using Gemini
    const prompt = `You are a document processing pipeline. Split the following text into distinct, logically complete semantic chunks. 
Return the output as a valid JSON array of strings. Do not output anything else.

Text:
${text.substring(0, 50000)}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" }
    });

    let chunks = [];
    try {
      chunks = JSON.parse(response.text || "[]");
    } catch(e) {
      chunks = [text]; // Fallback
    }

    await client.end();

    return NextResponse.json({ 
      chunks
    });

  } catch (error: any) {
    console.error("Chunks error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
