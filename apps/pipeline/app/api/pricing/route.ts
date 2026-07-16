import { NextResponse } from 'next/server';
import { Client } from 'pg';

export async function GET() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return NextResponse.json({ error: "DATABASE_URL not found" }, { status: 500 });
  }

  const client = new Client({ connectionString });

  try {
    await client.connect();
    // Fetch active plans ordered by display_order
    const res = await client.query(`
      SELECT 
        id, 
        name, 
        price_cents as "priceCents", 
        page_extraction_limit as "pageExtractionLimit",
        paddle_product_id as "paddleProductId",
        paddle_price_id as "paddlePriceId",
        is_active as "isActive",
        display_order as "displayOrder"
      FROM baseparse_pricing_plans
      WHERE is_active = true
      ORDER BY display_order ASC
    `);

    return NextResponse.json({ plans: res.rows });
  } catch (error: any) {
    console.error("Error fetching BaseParse plans via pg:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    await client.end();
  }
}
