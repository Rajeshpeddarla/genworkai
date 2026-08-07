import { NextResponse } from "next/server";
import { Client } from "pg";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import fs from "fs";

function logToFile(msg: string) {
  try {
    fs.appendFileSync("verify.log", new Date().toISOString() + " - " + msg + "\n");
  } catch (e) {}
}

export async function POST(request: Request) {
  try {
    const { order_id } = await request.json();
    if (!order_id) return NextResponse.json({ error: "Missing order_id" }, { status: 400 });

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isProd = process.env.NEXT_PUBLIC_ENVIRONMENT === 'production';
    const appId = (process.env.CASH_FREE_APPID || "").trim();
    const secret = (process.env.CASH_FREE_sECRET_KEY || "").trim();
    const baseUrl = isProd ? "https://api.cashfree.com" : "https://sandbox.cashfree.com";

    logToFile(`Verifying order_id: ${order_id} for user: ${user.id}`);

    // Fetch order details from Cashfree directly
    const res = await fetch(`${baseUrl}/pg/orders/${order_id}`, {
      headers: {
        "x-client-id": appId,
        "x-client-secret": secret,
        "x-api-version": "2023-08-01"
      }
    });

    if (!res.ok) {
      const errorData = await res.json();
      logToFile(`Cashfree fetch error: ${JSON.stringify(errorData)}`);
      return NextResponse.json({ error: "Failed to fetch order status from gateway" }, { status: 500 });
    }

    const data = await res.json();
    const status = data.order_status;
    logToFile(`Order status: ${status}, plan: ${data.order_tags?.plan_id}`);

    if (status === "PAID") {
      const internalPlanId = parseInt(data.order_tags?.plan_id);
      if (!internalPlanId) return NextResponse.json({ error: "Missing plan_id in Cashfree order_tags" }, { status: 400 });

      const connectionString = process.env.DATABASE_URL;
      const client = new Client({ connectionString });
      await client.connect();

      // No need to lookup plan via cashfree_plan_id anymore since we passed the actual internal ID in order_tags
      const planRes = await client.query('SELECT id FROM baseparse_pricing_plans WHERE id = $1 LIMIT 1', [internalPlanId]);
      
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
        logToFile(`Unknown internal plan ID: ${internalPlanId}`);
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
