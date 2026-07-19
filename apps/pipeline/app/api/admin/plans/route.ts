import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Client } from "pg";
import { Environment, Paddle } from '@paddle/paddle-node-sdk';

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

    const plansRes = await client.query('SELECT * FROM baseparse_pricing_plans ORDER BY display_order ASC');
    await client.end();

    let paddleProducts = [];
    if (process.env.PADDLE_API_KEY) {
      const paddle = new Paddle(process.env.PADDLE_API_KEY, {
        environment: process.env.PADDLE_API_KEY.startsWith("pdl_live") ? Environment.production : Environment.sandbox
      });
      const productsIter = paddle.products.list({ status: ['active'] });
      const products = [];
      for await (const p of productsIter) {
        products.push(p);
      }
      
      paddleProducts = await Promise.all(products.map(async p => {
        const pricesIter = paddle.prices.list({ productId: p.id, status: ['active'] });
        const prices = [];
        for await (const price of pricesIter) {
          prices.push({ id: price.id, description: price.description });
        }
        return {
          id: p.id,
          name: p.name,
          prices
        };
      }));
    }

    return NextResponse.json({ plans: plansRes.rows, paddleProducts });
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
    const { name, price_cents, page_extraction_limit, paddle_product_id, paddle_price_id, is_active } = body;

    const connectionString = process.env.DATABASE_URL;
    const client = new Client({ connectionString });
    await client.connect();

    const res = await client.query(`
      INSERT INTO baseparse_pricing_plans (name, price_cents, page_extraction_limit, paddle_product_id, paddle_price_id, is_active, display_order)
      VALUES ($1, $2, $3, $4, $5, $6, (SELECT COALESCE(MAX(display_order), 0) + 1 FROM baseparse_pricing_plans))
      RETURNING *
    `, [name, price_cents, page_extraction_limit, paddle_product_id, paddle_price_id, is_active]);

    await client.end();
    return NextResponse.json({ plan: res.rows[0] });
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
    const { id, name, price_cents, page_extraction_limit, paddle_product_id, paddle_price_id, is_active } = body;

    const connectionString = process.env.DATABASE_URL;
    const client = new Client({ connectionString });
    await client.connect();

    const res = await client.query(`
      UPDATE baseparse_pricing_plans 
      SET name = $1, price_cents = $2, page_extraction_limit = $3, paddle_product_id = $4, paddle_price_id = $5, is_active = $6, updated_at = NOW()
      WHERE id = $7
      RETURNING *
    `, [name, price_cents, page_extraction_limit, paddle_product_id, paddle_price_id, is_active, id]);

    await client.end();
    return NextResponse.json({ plan: res.rows[0] });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
