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

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Step 1: SHA256 Caching
    const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');
    
    // TEMPORARILY DISABLED FOR TESTING
    // const existingDocRes = await client.query(
    //   'SELECT extracted_data FROM baseparse_documents WHERE user_id = $1 AND checksum = $2 LIMIT 1', 
    //   [userId, fileHash]
    // );

    // if (existingDocRes.rows.length > 0) {
    //   await client.end();
    //   return NextResponse.json({ extractedData: existingDocRes.rows[0].extracted_data, cached: true });
    // }

    // Step 2: Preliminary Billing Check (ensure user is not already over quota)
    const planRes = await client.query(`
      SELECT up.id, up.pages_extracted_this_month, p.page_extraction_limit, p.name as plan_name
      FROM baseparse_user_plans up
      LEFT JOIN baseparse_pricing_plans p ON p.id = up.plan_id
      WHERE up.user_id = $1
    `, [userId]);

    let planName = 'free';
    if (planRes.rows.length > 0) {
      const userPlan = planRes.rows[0];
      planName = userPlan.plan_name?.toLowerCase() || 'free';
      if (userPlan.pages_extracted_this_month >= userPlan.page_extraction_limit) {
         await client.end();
         return NextResponse.json({ error: "Allocation limit exceeded. Please upgrade your node." }, { status: 402 });
      }
    }

    try {
      // Step 4: Insert initial processing record and get ID
      const insertRes = await client.query(`
        INSERT INTO baseparse_documents (user_id, file_name, status, page_count, extracted_data, checksum)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `, [userId, file.name, 'processing', 0, JSON.stringify({}), fileHash]);
      
      const dbJobId = insertRes.rows[0].id;
      
      const reqUrl = new URL(request.url);
      let webhookHost = reqUrl.host;
      // If running locally, docker container needs host.docker.internal to reach Next.js on the host
      if (webhookHost.includes('localhost')) {
        webhookHost = webhookHost.replace('localhost', 'host.docker.internal');
      }
      const webhookUrl = `${reqUrl.protocol}//${webhookHost}/api/v1/webhooks/extract?user_id=${userId}&file_hash=${fileHash}&file_type=${file.type || 'application/pdf'}&file_name=${encodeURIComponent(file.name)}`;
      
      // Create new FormData to send to Python, injecting job_id, webhook_url, and priority
      const pyFormData = new FormData();
      pyFormData.append("file", file);
      pyFormData.append("job_id", dbJobId.toString());
      pyFormData.append("webhook_url", webhookUrl);
      
      // Determine priority: Pro/Enterprise get high priority, everyone else gets default
      const priority = (planName === 'pro' || planName === 'enterprise') ? "high" : "default";
      pyFormData.append("priority", priority);

      // Step 3: Dispatch Asynchronous Job to Python
      const pythonResponse = await fetch("http://localhost:8000/api/v1/extract", {
        method: "POST",
        body: pyFormData,
      });

      if (!pythonResponse.ok) {
        throw new Error(`Python API error: ${await pythonResponse.text()}`);
      }

      // Step 4: Wait for the webhook to finish processing by polling the database internally
      let isCompleted = false;
      let finalData = null;
      let attempts = 0;
      
      while (!isCompleted && attempts < 100) { // 5 minute timeout (100 * 3s)
        await new Promise(resolve => setTimeout(resolve, 3000));
        attempts++;
        
        const checkRes = await client.query('SELECT status, extracted_data FROM baseparse_documents WHERE id = $1', [dbJobId]);
        if (checkRes.rows.length > 0) {
          const row = checkRes.rows[0];
          if (row.status === 'completed') {
            isCompleted = true;
            finalData = row.extracted_data;
          } else if (row.status === 'error') {
            await client.end();
            return NextResponse.json({ error: "Processing failed: " + JSON.stringify(row.extracted_data) }, { status: 500 });
          }
        }
      }

      await client.end();

      if (!isCompleted) {
         return NextResponse.json({ error: "Processing timed out" }, { status: 504 });
      }

      // Return the final data synchronously to the user
      return NextResponse.json(finalData);

    } catch (e: any) {
      await client.query(`
        INSERT INTO request_logs (user_id, file_name, status, execution_time_ms, request_metadata)
        VALUES ($1, $2, $3, $4, $5)
      `, [userId, file.name, 'error', 0, JSON.stringify({ error: e.message })]);
      await client.end();
      return NextResponse.json({ error: "Failed to queue Document Intelligence job: " + e.message }, { status: 400 });
    }

  } catch (error: any) {
    console.error("Extraction error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
