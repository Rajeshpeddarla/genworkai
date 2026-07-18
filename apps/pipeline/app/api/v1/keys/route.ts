import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Client } from "pg";
import crypto from "crypto";

export async function GET() {
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

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
     return NextResponse.json({ error: "Database misconfiguration" }, { status: 500 });
  }

  const client = new Client({ connectionString });
  try {
    await client.connect();
    const res = await client.query(`
      SELECT id, name, key_prefix, status, created_at, last_used_at 
      FROM baseparse_api_keys 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `, [user.id]);
    
    return NextResponse.json({ keys: res.rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    await client.end();
  }
}

export async function POST(request: Request) {
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

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const { name } = await request.json();
    if (!name) {
       return NextResponse.json({ error: "Key name is required" }, { status: 400 });
    }

    // Generate Key
    const rawKey = crypto.randomBytes(32).toString('hex');
    const fullKey = `bp_${rawKey}`;
    const keyPrefix = fullKey.substring(0, 10) + "...";
    
    // Hash for storage
    const keyHash = crypto.createHash('sha256').update(fullKey).digest('hex');

    const connectionString = process.env.DATABASE_URL;
    const client = new Client({ connectionString });
    
    await client.connect();
    
    const res = await client.query(`
      INSERT INTO baseparse_api_keys (user_id, key_hash, key_prefix, name, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, key_prefix, status, created_at
    `, [user.id, keyHash, keyPrefix, name, 'active']);

    await client.end();

    // We only return the full key once during creation!
    return NextResponse.json({ 
      key: res.rows[0],
      rawKey: fullKey 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
