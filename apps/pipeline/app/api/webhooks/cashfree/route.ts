import { NextResponse } from "next/server";
import { Client } from "pg";

export async function POST(request: Request) {
  try {
    const bodyText = await request.text();
    const event = JSON.parse(bodyText);

    // Cashfree webhooks typically have a 'type' or 'event' field
    const eventType = event.event || event.type;
    console.log(`[Cashfree Webhook] Received Event: ${eventType}`);

    if (eventType === "PAYMENT_SUCCESS_WEBHOOK") {
      
      const order = event.data?.order;
      if (!order) {
        console.error("No order data in Cashfree webhook");
        return NextResponse.json({ success: false });
      }

      const internalPlanIdStr = order.order_tags?.plan_id;
      const subscriberEmail = event.data?.customer_details?.customer_email;

      if (!subscriberEmail || !internalPlanIdStr) {
        console.error("Missing customer_email or plan_id in Cashfree webhook");
        return NextResponse.json({ success: false });
      }
      
      const internalPlanId = parseInt(internalPlanIdStr);

      const connectionString = process.env.DATABASE_URL;
      const client = new Client({ connectionString });
      await client.connect();

      // Look up user by email from auth.users
      const userRes = await client.query('SELECT id FROM auth.users WHERE email = $1 LIMIT 1', [subscriberEmail]);
      
      if (userRes.rows.length === 0) {
        console.error(`User with email ${subscriberEmail} not found in DB.`);
        await client.end();
        return NextResponse.json({ success: true });
      }
      
      const userId = userRes.rows[0].id;

      // Verify the internal plan exists
      const planRes = await client.query('SELECT id FROM baseparse_pricing_plans WHERE id = $1 LIMIT 1', [internalPlanId]);
      
      if (planRes.rows.length > 0) {
        // Check if user already has a plan
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
        
        console.log(`[Cashfree Webhook] Provisioned plan ${internalPlanId} for user ${userId}`);
      } else {
        console.error(`Internal plan not found for ID: ${internalPlanId}`);
      }

      await client.end();
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[Cashfree Webhook Error]", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
