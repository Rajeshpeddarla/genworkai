import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Client } from "pg";
import crypto from "crypto";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const jobId = params.id;
    if (!jobId) {
      return NextResponse.json({ error: "Job ID required" }, { status: 400 });
    }

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
      
      const res = await client.query('SELECT user_id FROM baseparse_api_keys WHERE key_hash = $1 AND status = $2', [keyHash, 'active']);
      if (res.rows.length > 0) {
        userId = res.rows[0].user_id;
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

    const docRes = await client.query(
      'SELECT status, extracted_data FROM baseparse_documents WHERE id = $1 AND user_id = $2', 
      [jobId, userId]
    );

    await client.end();

    if (docRes.rows.length === 0) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const jobRow = docRes.rows[0];

    if (jobRow.status === 'completed') {
      return NextResponse.json({ 
        job_id: jobId, 
        status: jobRow.status,
        extractedData: jobRow.extracted_data 
      });
    } else {
      return NextResponse.json({ 
        job_id: jobId, 
        status: jobRow.status 
      });
    }

  } catch (error: any) {
    console.error("Job Polling Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
