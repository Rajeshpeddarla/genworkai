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

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      await client.end();
      return NextResponse.json({ error: "No file detected" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Data = buffer.toString("base64");
    
    // Simple text extraction prompt
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: "application/pdf", data: base64Data } },
            { text: "Extract all the text from this document as plain text. Do not output JSON. Do not output markdown. Just the raw text." }
          ]
        }
      ]
    });

    // Check Billing Plan (OCR counts as 1 page extraction minimum for billing purposes, ideally we calculate real page count, but OCR is simplified)
    const planRes = await client.query(`
      SELECT up.id, up.pages_extracted_this_month, p.page_extraction_limit 
      FROM baseparse_user_plans up
      LEFT JOIN baseparse_pricing_plans p ON p.id = up.plan_id
      WHERE up.user_id = $1
    `, [userId]);

    if (planRes.rows.length > 0) {
      const userPlan = planRes.rows[0];
      if (userPlan.pages_extracted_this_month + 1 > userPlan.page_extraction_limit) {
         await client.end();
         return NextResponse.json({ error: "Allocation limit exceeded." }, { status: 402 });
      }
      await client.query(`
        UPDATE baseparse_user_plans 
        SET pages_extracted_this_month = pages_extracted_this_month + 1 
        WHERE id = $2
      `, [userPlan.id]);
    }

    await client.end();

    return NextResponse.json({ 
      text: response.text 
    });

  } catch (error: any) {
    console.error("OCR error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
