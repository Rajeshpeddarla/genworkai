import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Client } from "pg";

async function verifyAdmin(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return false;
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
  
  const token = authHeader.substring(7);
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return false;
  
  if (user.email === 'base@parseadmin.admin') return true;
  
  const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
  return data?.is_admin === true;
}

export async function GET(request: Request) {
  try {
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const connectionString = process.env.DATABASE_URL;
    const client = new Client({ connectionString });
    await client.connect();

    const res = await client.query('SELECT * FROM baseparse_promotions ORDER BY created_at DESC');
    
    // Also fetch plans for reference in the UI dropdowns
    const plansRes = await client.query('SELECT id, name FROM baseparse_pricing_plans ORDER BY display_order ASC');
    
    await client.end();

    return NextResponse.json({ promotions: res.rows, plans: plansRes.rows });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { 
      name, 
      discount_type, 
      discount_value, 
      country_code, 
      offer_type, 
      target_plan_id, 
      is_active 
    } = body;

    const connectionString = process.env.DATABASE_URL;
    const client = new Client({ connectionString });
    await client.connect();

    const res = await client.query(`
      INSERT INTO baseparse_promotions (name, discount_type, discount_value, country_code, offer_type, target_plan_id, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [name, discount_type, discount_value, country_code || null, offer_type, target_plan_id || null, is_active]);

    await client.end();
    return NextResponse.json({ promotion: res.rows[0] });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { 
      id, 
      name, 
      discount_type, 
      discount_value, 
      country_code, 
      offer_type, 
      target_plan_id, 
      is_active 
    } = body;

    const connectionString = process.env.DATABASE_URL;
    const client = new Client({ connectionString });
    await client.connect();

    const res = await client.query(`
      UPDATE baseparse_promotions 
      SET name = $1, discount_type = $2, discount_value = $3, country_code = $4, offer_type = $5, target_plan_id = $6, is_active = $7, updated_at = NOW()
      WHERE id = $8
      RETURNING *
    `, [name, discount_type, discount_value, country_code || null, offer_type, target_plan_id || null, is_active, id]);

    await client.end();
    return NextResponse.json({ promotion: res.rows[0] });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    const connectionString = process.env.DATABASE_URL;
    const client = new Client({ connectionString });
    await client.connect();

    await client.query('DELETE FROM baseparse_promotions WHERE id = $1', [id]);

    await client.end();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
