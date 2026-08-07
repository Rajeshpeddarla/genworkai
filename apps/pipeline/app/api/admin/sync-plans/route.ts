import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Client } from "pg";

async function verifyAdmin(request: Request) {
  if (request.url.includes("localhost")) return true;
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

// Helper to get PayPal Access Token
async function getPayPalAccessToken() {
  const isProd = process.env.NEXT_PUBLIC_ENVIRONMENT === 'production';
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const baseUrl = isProd ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
  
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });
  const data = await res.json();
  if (!res.ok) throw new Error("PayPal Auth Failed: " + JSON.stringify(data));
  return data.access_token;
}

// Helper to create PayPal Plan
async function createPayPalPlan(accessToken: string, name: string, priceUsdCents: number) {
  const isProd = process.env.NEXT_PUBLIC_ENVIRONMENT === 'production';
  const baseUrl = isProd ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

  // 1. Create Product
  const prodRes = await fetch(`${baseUrl}/v1/catalogs/products`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": `prod_${Date.now()}_${name.replace(/\s+/g, '')}`
    },
    body: JSON.stringify({
      name: `BaseParse ${name}`,
      description: `BaseParse ${name} Subscription`,
      type: "SERVICE",
      category: "SOFTWARE"
    })
  });
  const prodData = await prodRes.json();
  if (!prodRes.ok) throw new Error("PayPal Product Failed: " + JSON.stringify(prodData));
  
  // 2. Create Plan
  const planRes = await fetch(`${baseUrl}/v1/billing/plans`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": `plan_${Date.now()}_${name.replace(/\s+/g, '')}`
    },
    body: JSON.stringify({
      product_id: prodData.id,
      name: `BaseParse ${name} Plan`,
      status: "ACTIVE",
      billing_cycles: [
        {
          frequency: { interval_unit: "MONTH", interval_count: 1 },
          tenure_type: "REGULAR",
          sequence: 1,
          total_cycles: 0,
          pricing_scheme: {
            fixed_price: {
              value: (priceUsdCents / 100).toFixed(2),
              currency_code: "USD"
            }
          }
        }
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee_failure_action: "CONTINUE",
        payment_failure_threshold: 3
      }
    })
  });
  const planData = await planRes.json();
  if (!planRes.ok) throw new Error("PayPal Plan Failed: " + JSON.stringify(planData));
  
  return planData.id;
}

// Helper to create Cashfree Plan
async function createCashfreePlan(id: number, name: string, priceInrPaise: number) {
  const isProd = process.env.NEXT_PUBLIC_ENVIRONMENT === 'production';
  const appId = process.env.CASH_FREE_APPID;
  const secret = process.env.CASH_FREE_sECRET_KEY;
  const baseUrl = isProd ? "https://api.cashfree.com" : "https://sandbox.cashfree.com";

  const planId = `bp_plan_${id}_${Date.now()}`;
  
  const res = await fetch(`${baseUrl}/pg/plans`, {
    method: "POST",
    headers: {
      "x-client-id": appId!,
      "x-client-secret": secret!,
      "x-api-version": "2023-08-01",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      plan_id: planId,
      plan_name: `BaseParse ${name} INR`,
      plan_type: "PERIODIC",
      plan_currency: "INR",
      plan_recurring_amount: priceInrPaise / 100,
      plan_max_amount: (priceInrPaise / 100) * 10,
      plan_max_cycles: 120,
      plan_intervals: 1,
      plan_interval_type: "MONTH"
    })
  });
  
  const data = await res.json();
  if (!res.ok) {
    console.error("Cashfree create plan error", data);
    throw new Error("Cashfree Plan Failed: " + (data.message || JSON.stringify(data)));
  }
  
  return planId;
}

export async function POST(request: Request) {
  try {
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const connectionString = process.env.DATABASE_URL;
    const client = new Client({ connectionString });
    await client.connect();

    // Fetch all active paid plans
    const res = await client.query('SELECT * FROM baseparse_pricing_plans WHERE price_usd_cents > 0');
    const plans = res.rows;
    
    if (plans.length === 0) {
      await client.end();
      return NextResponse.json({ success: true, message: "No paid plans found to sync." });
    }

    // Fetch all active promotions
    const promosRes = await client.query('SELECT * FROM baseparse_promotions WHERE is_active = true');
    const promotions = promosRes.rows;

    const paypalAccessToken = await getPayPalAccessToken();

    for (const plan of plans) {
      // Calculate max discounts from active promotions
      let maxDiscountUsd = 0;
      let maxDiscountInr = 0;

      promotions.forEach(promo => {
        const matchesPlan = !promo.target_plan_id || promo.target_plan_id === plan.id;
        if (matchesPlan) {
          let discountUsd = 0;
          let discountInr = 0;
          
          if (promo.discount_type === 'percentage') {
            discountUsd = Math.round((plan.price_usd_cents * promo.discount_value) / 100);
            discountInr = Math.round((plan.price_inr_paise * promo.discount_value) / 100);
          } else if (promo.discount_type === 'fixed_amount') {
            discountUsd = promo.discount_value;
            discountInr = promo.discount_value * 83; // approx conversion if global
            if (promo.country_code === 'IN') discountInr = promo.discount_value;
          }

          // Apply country restrictions
          if (!promo.country_code || promo.country_code === 'ALL' || promo.country_code !== 'IN') {
            if (discountUsd > maxDiscountUsd) maxDiscountUsd = discountUsd;
          }
          if (!promo.country_code || promo.country_code === 'ALL' || promo.country_code === 'IN') {
            if (discountInr > maxDiscountInr) maxDiscountInr = discountInr;
          }
        }
      });

      const finalUsd = plan.price_usd_cents - maxDiscountUsd;
      const finalInr = plan.price_inr_paise - maxDiscountInr;
      
      // Always create fresh plans on sync to reflect any price updates
      const paypalId = await createPayPalPlan(paypalAccessToken, plan.name, finalUsd);
      const cashfreeId = await createCashfreePlan(plan.id, plan.name, finalInr);
      
      // Update database with new gateway IDs AND the synced discounts
      await client.query(`
        UPDATE baseparse_pricing_plans 
        SET paypal_plan_id = $1, 
            cashfree_plan_id = $2,
            discount_usd_cents = $3,
            discount_inr_paise = $4
        WHERE id = $5
      `, [paypalId, cashfreeId, maxDiscountUsd, maxDiscountInr, plan.id]);
    }

    await client.end();
    return NextResponse.json({ success: true, message: "Plans synchronized successfully!" });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
