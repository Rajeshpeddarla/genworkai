import { NextResponse } from 'next/server';
import { Client } from 'pg';
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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

export async function POST(request: Request) {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return NextResponse.json({ error: "DATABASE_URL not found" }, { status: 500 });

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { planId, region } = body;

  const client = new Client({ connectionString });
  
  try {
    await client.connect();

    const planRes = await client.query('SELECT * FROM baseparse_pricing_plans WHERE id = $1', [planId]);
    if (planRes.rows.length === 0) throw new Error("Plan not found");
    const plan = planRes.rows[0];

    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    const protocol = request.headers.get('x-forwarded-proto') || (host?.includes('localhost') ? 'http' : 'https');
    
    // Prefer origin (which includes protocol), fallback to host, fallback to env variable
    const baseUrl = origin || (host ? `${protocol}://${host}` : (process.env.PUBLIC_DEV_URL || 'http://localhost:3000'));

    if (region === 'IN') {
      const isProd = process.env.NEXT_PUBLIC_ENVIRONMENT === 'production';
      const appId = (process.env.CASH_FREE_APPID || "").trim();
      const secret = (process.env.CASH_FREE_sECRET_KEY || "").trim();
      const baseUrlCF = isProd ? "https://api.cashfree.com" : "https://sandbox.cashfree.com";
      
      if (!appId || !secret) {
        throw new Error("Missing Cashfree API credentials in environment variables. Please restart your dev server if you recently added them.");
      }
      
      const orderId = `order_${user.id.replace(/-/g, '').substring(0, 8)}_${Date.now()}`;
      
      // Calculate final INR amount in Rupees (not paise)
      const finalInrPaise = plan.price_inr_paise - (plan.discount_inr_paise || 0);
      const orderAmount = parseFloat((finalInrPaise / 100).toFixed(2));
      
      const payload = {
        order_id: orderId,
        order_amount: orderAmount,
        order_currency: "INR",
        customer_details: {
          customer_id: user.id,
          customer_name: user.email?.split('@')[0] || 'User',
          customer_email: user.email,
          customer_phone: "9999999999"
        },
        order_meta: {
          return_url: `${baseUrl}/dashboard/plans?success=true&purchased_plan_id=${planId}&order_id=${orderId}`
        },
        order_tags: {
          plan_id: planId.toString()
        }
      };
      
      const cfRes = await fetch(`${baseUrlCF}/pg/orders`, {
        method: "POST",
        headers: {
          "x-client-id": appId,
          "x-client-secret": secret,
          "x-api-version": "2023-08-01",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload),
        cache: 'no-store'
      });
      
      const cfData = await cfRes.json();
      if (!cfRes.ok) {
        throw new Error("Cashfree Order Failed: " + (cfData.message || JSON.stringify(cfData)));
      }
      
      console.log("Cashfree Success Response:", JSON.stringify(cfData));
      
      return NextResponse.json({ 
        cashfreeSessionId: cfData.payment_session_id 
      });
      
    } else {
      // PayPal Logic
      if (!plan.paypal_plan_id) throw new Error("PayPal plan not synchronized for this tier.");
      
      const isProd = process.env.NEXT_PUBLIC_ENVIRONMENT === 'production';
      const baseUrlPP = isProd ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
      const token = await getPayPalAccessToken();
      
      const ppRes = await fetch(`${baseUrlPP}/v1/billing/subscriptions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          plan_id: plan.paypal_plan_id,
          subscriber: {
            name: { given_name: user.email?.split('@')[0] || 'User' },
            email_address: user.email
          },
          application_context: {
            brand_name: "BaseParse",
            locale: "en-US",
            shipping_preference: "NO_SHIPPING",
            user_action: "SUBSCRIBE_NOW",
            return_url: `${baseUrl}/dashboard/plans?success=true&purchased_plan_id=${planId}`,
            cancel_url: `${baseUrl}/dashboard/plans?canceled=true&purchased_plan_id=${planId}`
          }
        })
      });
      
      const ppData = await ppRes.json();
      if (!ppRes.ok) throw new Error("PayPal Subscription Failed: " + JSON.stringify(ppData));
      
      const approveLink = ppData.links?.find((link: any) => link.rel === "approve")?.href;
      if (!approveLink) throw new Error("Could not find approve link in PayPal response");
      
      return NextResponse.json({ checkoutUrl: approveLink });
    }
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    await client.end();
  }
}
