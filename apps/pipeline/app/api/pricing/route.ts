import { NextResponse } from 'next/server';
import { Client } from 'pg';
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return NextResponse.json({ error: "DATABASE_URL not found" }, { status: 500 });
  }

  const cookieStore = cookies();
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

    let currentPlanId = null;
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const planRes = await client.query(`SELECT plan_id FROM baseparse_user_plans WHERE user_id = $1 LIMIT 1`, [user.id]);
      if (planRes.rows.length > 0) {
        currentPlanId = planRes.rows[0].plan_id;
      }
    }
    
    if (!currentPlanId) {
       const freePlanRes = await client.query(`SELECT id FROM baseparse_pricing_plans WHERE price_cents = 0 LIMIT 1`);
       if (freePlanRes.rows.length > 0) currentPlanId = freePlanRes.rows[0].id;
    }

    return NextResponse.json({ plans: res.rows, currentPlanId });
  } catch (error: any) {
    console.error("Error fetching BaseParse plans via pg:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    await client.end();
  }
}
