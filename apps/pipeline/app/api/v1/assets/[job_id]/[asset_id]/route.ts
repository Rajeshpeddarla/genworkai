import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Client } from "pg";
import crypto from "crypto";

export async function GET(request: Request, { params }: { params: Promise<{ job_id: string, asset_id: string }> }) {
  try {
    const { job_id, asset_id } = await params;
    
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

    // Optional: Verify the job belongs to the user for strict security
    const jobRes = await client.query('SELECT id FROM baseparse_documents WHERE id = $1 AND user_id = $2', [job_id, userId]);
    await client.end();

    if (jobRes.rows.length === 0) {
        return NextResponse.json({ error: "Unauthorized or job not found" }, { status: 403 });
    }

    // Proxy the request to the Python worker
    const workerBaseUrl = process.env.MODAL_WORKER_URL ? process.env.MODAL_WORKER_URL.replace(/\/extract$/, '') : "http://localhost:8000/api/worker";
    const pythonUrl = `${workerBaseUrl}/assets/${job_id}/${asset_id}`;

    const pythonResponse = await fetch(pythonUrl);

    if (!pythonResponse.ok) {
        return NextResponse.json({ error: "Asset not found or expired" }, { status: 404 });
    }

    // Stream the binary data back to the client
    const headers = new Headers();
    headers.set('Content-Type', pythonResponse.headers.get('Content-Type') || 'image/jpeg');
    headers.set('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours

    return new NextResponse(pythonResponse.body, {
        status: 200,
        headers: headers
    });

  } catch (error: any) {
    console.error("Asset proxy error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
