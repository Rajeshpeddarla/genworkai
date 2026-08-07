import { NextResponse } from 'next/server';
import { Client } from 'pg';
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return NextResponse.json({ error: "DATABASE_URL not found" }, { status: 500 });
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

  const client = new Client({ connectionString });

  try {
    await client.connect();
    // Fetch active plans ordered by display_order
    const res = await client.query(`
      SELECT 
        id, 
        name, 
        price_usd_cents as "priceUsdCents", 
        price_inr_paise as "priceInrPaise",
        discount_usd_cents as "discountUsdCents",
        discount_inr_paise as "discountInrPaise",
        page_extraction_limit as "pageExtractionLimit",
        paddle_product_id as "paddleProductId",
        paddle_price_id as "paddlePriceId",
        paypal_plan_id as "paypalPlanId",
        cashfree_plan_id as "cashfreePlanId",
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
       const freePlanRes = await client.query(`SELECT id FROM baseparse_pricing_plans WHERE price_usd_cents = 0 LIMIT 1`);
       if (freePlanRes.rows.length > 0) currentPlanId = freePlanRes.rows[0].id;
    }

    // Extract location info
    const countryCodeHeader = request.headers.get('x-vercel-ip-country');
    const url = new URL(request.url);
    const tz = url.searchParams.get('tz') || '';
    
    let countryCode = countryCodeHeader || 'US';
    if (!countryCodeHeader && (tz.includes('Kolkata') || tz.includes('Calcutta') || tz.includes('Asia/Colombo'))) {
      countryCode = 'IN';
    }

    // Fetch active promotions
    const promosRes = await client.query('SELECT * FROM baseparse_promotions WHERE is_active = true');
    const promotions = promosRes.rows;

    // Apply promotions to calculate dynamic discounts
    const enrichedPlans = res.rows.map(plan => {
      let maxDiscountUsd = 0;
      let maxDiscountInr = 0;

      promotions.forEach(promo => {
        // Check applicability
        const matchesCountry = !promo.country_code || promo.country_code === 'ALL' || promo.country_code === countryCode;
        const matchesPlan = !promo.target_plan_id || promo.target_plan_id === plan.id;
        
        if (matchesCountry && matchesPlan) {
          let discountUsd = 0;
          let discountInr = 0;
          
          if (promo.discount_type === 'percentage') {
            discountUsd = Math.round((plan.priceUsdCents * promo.discount_value) / 100);
            discountInr = Math.round((plan.priceInrPaise * promo.discount_value) / 100);
          } else if (promo.discount_type === 'fixed_amount') {
            // Assume the fixed amount is in cents/paise for simplicity depending on region viewed
            discountUsd = promo.discount_value;
            discountInr = promo.discount_value * 83; // rough conversion if applying globally, but usually targeted
            if (promo.country_code === 'IN') discountInr = promo.discount_value; // if explicitly targeted at India, it's paise
          }

          if (discountUsd > maxDiscountUsd) maxDiscountUsd = discountUsd;
          if (discountInr > maxDiscountInr) maxDiscountInr = discountInr;
        }
      });

      return {
        ...plan,
        discountUsdCents: maxDiscountUsd,
        discountInrPaise: maxDiscountInr,
      };
    });

    return NextResponse.json({ plans: enrichedPlans, currentPlanId });
  } catch (error: any) {
    console.error("Error fetching BaseParse plans via pg:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    await client.end();
  }
}
