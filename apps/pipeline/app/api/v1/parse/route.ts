import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Client } from "pg";
import crypto from "crypto";

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
        const apiKeyId = res.rows[0].id;
        await client.query('UPDATE baseparse_api_keys SET last_used_at = NOW() WHERE id = $1', [apiKeyId]);
      }

      if (!userId) {
        await client.end();
        return NextResponse.json({ error: "Invalid API Key" }, { status: 401 });
      }
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        await client.end();
        return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
      }
      userId = user.id;
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      await client.end();
      return NextResponse.json({ error: "No payload detected" }, { status: 400 });
    }

    const startTime = Date.now();
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Step 1: SHA256 Caching
    const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');
    
    // Check if duplicate document already exists for this user
    const existingDocRes = await client.query(
      'SELECT extracted_data FROM baseparse_documents WHERE user_id = $1 AND checksum = $2 LIMIT 1', 
      [userId, fileHash]
    );

    if (existingDocRes.rows.length > 0) {
      await client.end();
      return NextResponse.json({ extractedData: existingDocRes.rows[0].extracted_data, cached: true });
    }

    let extractedData;
    let realPageCount = 1;
    
    try {
      // Step 2: Document Intelligence via Python API (BaseParse V3)
      const pythonResponse = await fetch("http://localhost:8000/api/v1/extract", {
        method: "POST",
        body: formData,
      });

      if (!pythonResponse.ok) {
        throw new Error(`Python API error: ${await pythonResponse.text()}`);
      }

      extractedData = await pythonResponse.json();
      realPageCount = extractedData.document?.pages || 1;
      
      // Update missing root level checksum and documentId
      extractedData.documentId = `node_${Date.now()}`;
      extractedData.fileName = file.name;
      extractedData.pagesProcessed = realPageCount;
      extractedData.status = "SUCCESS";
      extractedData.metadata = {
        ...extractedData.metadata,
        processingTimeMs: Date.now() - startTime,
        format: file.type || "application/pdf"
      };

    } catch (e: any) {
      await client.query(`
        INSERT INTO request_logs (user_id, file_name, status, execution_time_ms, request_metadata)
        VALUES ($1, $2, $3, $4, $5)
      `, [userId, file.name, 'error', Date.now() - startTime, JSON.stringify({ error: e.message })]);
      await client.end();
      return NextResponse.json({ error: "Failed to process via Document Intelligence: " + e.message }, { status: 400 });
    }

    // Step 3: Billing & Allocation Check
    const planRes = await client.query(`
      SELECT up.id, up.pages_extracted_this_month, p.page_extraction_limit 
      FROM baseparse_user_plans up
      LEFT JOIN baseparse_pricing_plans p ON p.id = up.plan_id
      WHERE up.user_id = $1
    `, [userId]);

    if (planRes.rows.length > 0) {
      const userPlan = planRes.rows[0];
      if (userPlan.pages_extracted_this_month + realPageCount > userPlan.page_extraction_limit) {
         await client.end();
         return NextResponse.json({ error: "Allocation limit exceeded. Please upgrade your node." }, { status: 402 });
      }

      await client.query(`
        UPDATE baseparse_user_plans 
        SET pages_extracted_this_month = pages_extracted_this_month + $1 
        WHERE id = $2
      `, [realPageCount, userPlan.id]);
    }

    // Step 4: Persist Results with Checksum
    await client.query(`
      INSERT INTO baseparse_documents (user_id, file_name, status, page_count, extracted_data, checksum)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [userId, file.name, 'completed', realPageCount, JSON.stringify(extractedData), fileHash]);

    // Step 5: Log Request
    await client.query(`
      INSERT INTO request_logs (user_id, file_name, status, execution_time_ms, request_metadata)
      VALUES ($1, $2, $3, $4, $5)
    `, [userId, file.name, 'success', Date.now() - startTime, JSON.stringify(extractedData)]);

    await client.end();

    return NextResponse.json({ extractedData, cached: false });

  } catch (error: any) {
    console.error("Extraction error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
