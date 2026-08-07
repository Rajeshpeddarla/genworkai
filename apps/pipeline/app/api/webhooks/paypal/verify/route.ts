import { NextResponse } from "next/server";
import { Client } from "pg";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import fs from "fs";

function logToFile(msg: string) {
  try {
    fs.appendFileSync("paypal_verify.log", new Date().toISOString() + " - " + msg + "\n");
  } catch (e) {}
}

async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch("https://api-m.sandbox.paypal.com/v1/oauth2/token", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials",
    cache: "no-store"
  });
  const data = await res.json();
  if (!res.ok) throw new Error("PayPal Auth Failed: " + JSON.stringify(data));
  return data.access_token;
}

export async function POST(request: Request) {
  try {
    const { subscription_id } = await request.json();
    if (!subscription_id) return NextResponse.json({ error: "Missing subscription_id" }, { status: 400 });

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    logToFile(`Verifying paypal sub_id: ${subscription_id} for user: ${user.id}`);

    const token = await getPayPalAccessToken();

    // Fetch subscription details from PayPal directly
    const res = await fetch(`https://api-m.sandbox.paypal.com/v1/billing/subscriptions/${subscription_id}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      cache: "no-store"
    });

    if (!res.ok) {
      const errorData = await res.json();
      logToFile(`PayPal fetch error: ${JSON.stringify(errorData)}`);
      return NextResponse.json({ error: "Failed to fetch subscription status from gateway" }, { status: 500 });
    }

    const data = await res.json();
    const status = data.status;
    logToFile(`Subscription status: ${status}, plan: ${data.plan_id}`);

    // Accept multiple valid post-checkout statuses
    if (status === "ACTIVE" || status === "APPROVED") {
      const paypalPlanId = data.plan_id;
      if (!paypalPlanId) return NextResponse.json({ error: "Missing plan_id in PayPal response" }, { status: 400 });

      const connectionString = process.env.DATABASE_URL;
      const client = new Client({ connectionString });
      await client.connect();

      // Find internal plan ID based on paypal_plan_id
      const planRes = await client.query('SELECT id FROM baseparse_pricing_plans WHERE paypal_plan_id = $1 LIMIT 1', [paypalPlanId]);
      
      if (planRes.rows.length > 0) {
        const internalPlanId = planRes.rows[0].id;
        
        // Check if user already has a plan
        const existingPlanRes = await client.query('SELECT id FROM baseparse_user_plans WHERE user_id = $1 LIMIT 1', [user.id]);
        
        if (existingPlanRes.rows.length > 0) {
          await client.query(`
            UPDATE baseparse_user_plans 
            SET plan_id = $2, updated_at = NOW()
            WHERE user_id = $1;
          `, [user.id, internalPlanId]);
        } else {
          await client.query(`
            INSERT INTO baseparse_user_plans (user_id, plan_id, created_at)
            VALUES ($1, $2, NOW());
          `, [user.id, internalPlanId]);
        }
        
        logToFile(`Provisioned plan ${internalPlanId} for user ${user.id}`);
        await client.end();
        return NextResponse.json({ success: true, active: true, planId: internalPlanId });
      } else {
        logToFile(`Unknown plan ID: ${paypalPlanId}`);
        await client.end();
        return NextResponse.json({ error: "Unknown plan ID" }, { status: 400 });
      }
    }

    logToFile(`Status not acceptable: ${status}`);
    return NextResponse.json({ success: true, active: false });
  } catch (error: any) {
    logToFile(`Fallback verify error: ${error.message}`);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
