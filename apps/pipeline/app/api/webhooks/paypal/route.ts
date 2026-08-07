import { NextResponse } from "next/server";
import { Client } from "pg";

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const event = JSON.parse(body);

    console.log(`[PayPal Webhook] Received Event: ${event.event_type}`);

    if (event.event_type === "BILLING.SUBSCRIPTION.ACTIVATED" || event.event_type === "BILLING.SUBSCRIPTION.CANCELLED") {
      
      const resource = event.resource;
      const paypalPlanId = resource.plan_id;
      const subscriberEmail = resource.subscriber?.email_address;

      if (!subscriberEmail || !paypalPlanId) {
        console.error("Missing subscriber email or plan id in PayPal webhook");
        return NextResponse.json({ success: false });
      }

      const connectionString = process.env.DATABASE_URL;
      const client = new Client({ connectionString });
      await client.connect();

      // 1. Find user by email (using auth.users is harder with pg, let's look up profiles or just user_plans if it has email? wait, we don't store email in user_plans)
      // Since it's supabase, the email is in auth.users. But we can fetch it via pg:
      const userRes = await client.query('SELECT id FROM auth.users WHERE email = $1 LIMIT 1', [subscriberEmail]);
      
      if (userRes.rows.length === 0) {
        console.error(`User with email ${subscriberEmail} not found in DB.`);
        await client.end();
        return NextResponse.json({ success: true }); // Acknowledge anyway
      }
      
      const userId = userRes.rows[0].id;

      if (event.event_type === "BILLING.SUBSCRIPTION.ACTIVATED") {
        // 2. Find our internal plan ID based on paypal_plan_id
        const planRes = await client.query('SELECT id FROM baseparse_pricing_plans WHERE paypal_plan_id = $1 LIMIT 1', [paypalPlanId]);
        
        if (planRes.rows.length > 0) {
          const internalPlanId = planRes.rows[0].id;
          
          // Upsert the user plan
          const existingPlanRes = await client.query('SELECT id FROM baseparse_user_plans WHERE user_id = $1 LIMIT 1', [userId]);
          
          if (existingPlanRes.rows.length > 0) {
            await client.query(`
              UPDATE baseparse_user_plans 
              SET plan_id = $2, updated_at = NOW()
              WHERE user_id = $1;
            `, [userId, internalPlanId]);
          } else {
            await client.query(`
              INSERT INTO baseparse_user_plans (user_id, plan_id, created_at)
              VALUES ($1, $2, NOW());
            `, [userId, internalPlanId]);
          }
          
          console.log(`[PayPal Webhook] Provisioned plan ${internalPlanId} for user ${userId}`);
        } else {
          console.error(`Internal plan not found for PayPal Plan ID: ${paypalPlanId}`);
        }
      } else if (event.event_type === "BILLING.SUBSCRIPTION.CANCELLED") {
        // Find the free plan
        const freePlanRes = await client.query(`SELECT id FROM baseparse_pricing_plans WHERE price_usd_cents = 0 LIMIT 1`);
        if (freePlanRes.rows.length > 0) {
          const freePlanId = freePlanRes.rows[0].id;
          await client.query(`
            UPDATE baseparse_user_plans SET plan_id = $1 WHERE user_id = $2
          `, [freePlanId, userId]);
          console.log(`[PayPal Webhook] Downgraded user ${userId} to free plan`);
        }
      }

      await client.end();
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[PayPal Webhook Error]", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
