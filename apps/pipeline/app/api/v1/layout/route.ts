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
    const documentType = formData.get("document_type") as string | null || "default";
    const extractOptions = formData.get("extract") as string | null || "";

    if (!file) {
      await client.end();
      return NextResponse.json({ error: "No payload detected" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Step 1: SHA256 Caching (Idempotency) - include api type to prevent cache collisions
    const fileHash = crypto.createHash('sha256').update(buffer).update('layout').digest('hex');
    
    const existingDocRes = await client.query(
      "SELECT id, status, extracted_data FROM baseparse_documents WHERE user_id = $1 AND checksum = $2 AND status = 'completed' LIMIT 1", 
      [userId, fileHash]
    );

    if (existingDocRes.rows.length > 0) {
      await client.end();
      // If a completed extraction already exists, return the cached result
      const parsedData = typeof existingDocRes.rows[0].extracted_data === 'string' 
                         ? JSON.parse(existingDocRes.rows[0].extracted_data) 
                         : existingDocRes.rows[0].extracted_data;
      return NextResponse.json(parsedData);
    }

    const userWebhookUrl = formData.get("webhook_url") as string | null;

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
      let protocol = reqUrl.protocol;
      
      // If running locally, the cloud Modal worker needs a public URL to reach the webhook
      if (webhookHost.includes('localhost')) {
        if (process.env.PUBLIC_DEV_URL) {
           const devUrl = new URL(process.env.PUBLIC_DEV_URL);
           webhookHost = devUrl.host;
           protocol = devUrl.protocol;
        } else {
           // Fallback to docker internal if they are still using local docker-compose python worker
           webhookHost = webhookHost.replace('localhost', 'host.docker.internal');
        }
      }
      
      let internalWebhookUrl = `${protocol}//${webhookHost}/api/v1/webhooks/layout?user_id=${userId}&file_hash=${fileHash}&file_type=${file.type || 'application/pdf'}&file_name=${encodeURIComponent(file.name)}`;
      
      if (userWebhookUrl) {
         internalWebhookUrl += `&user_webhook=${encodeURIComponent(userWebhookUrl)}`;
      }
      
      // Create new FormData to send to Python, injecting job_id, webhook_url, and priority
      const pyFormData = new FormData();
      pyFormData.append("file", file);
      pyFormData.append("job_id", dbJobId.toString());
      pyFormData.append("webhook_url", internalWebhookUrl);
      
      // Determine priority: Pro/Enterprise get high priority, everyone else gets default
      const priority = (planName === 'pro' || planName === 'enterprise') ? "high" : "default";
      pyFormData.append("priority", priority);
      pyFormData.append("document_type", documentType);
      pyFormData.append("extract", extractOptions);
      pyFormData.append("gemini_api_key", process.env.GEMINI_API_KEY || "");

      // Step 3: Dispatch Asynchronous Job to Python
      const workerBaseUrl = process.env.MODAL_WORKER_URL ? process.env.MODAL_WORKER_URL.replace(/\/extract$/, '') : "http://localhost:8000/api/worker";
      const workerUrl = `${workerBaseUrl}/layout`;
      
      const pythonResponse = await fetch(workerUrl, {
        method: "POST",
        body: pyFormData,
      });

      if (!pythonResponse.ok) {
        throw new Error(`Python API error: ${await pythonResponse.text()}`);
      }

      await client.end();

      // Step 4: Return immediately. The client must poll or wait for their webhook.
      return NextResponse.json({ status: "queued", job_id: dbJobId }, { status: 202 });

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
