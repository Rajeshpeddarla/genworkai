import { config } from 'dotenv';
config({ path: '.env.local' });

async function main() {
  const { db } = await import('./db/index');
  const { sql } = await import('drizzle-orm');
  const statements = [
    `ALTER TABLE "subscription_plans" ADD COLUMN IF NOT EXISTS "paddle_product_id" varchar(255);`,
    `ALTER TABLE "subscription_plans" ADD COLUMN IF NOT EXISTS "paddle_monthly_price_id" varchar(255);`,
    `ALTER TABLE "subscription_plans" ADD COLUMN IF NOT EXISTS "paddle_yearly_price_id" varchar(255);`,
    
    // Limits
    `ALTER TABLE "subscription_plans" ADD COLUMN IF NOT EXISTS "knowledge_base_limit" integer DEFAULT 0;`,
    `ALTER TABLE "subscription_plans" ADD COLUMN IF NOT EXISTS "database_limit" integer DEFAULT 0;`,
    `ALTER TABLE "subscription_plans" ADD COLUMN IF NOT EXISTS "workspace_limit" integer DEFAULT 0;`,
    `ALTER TABLE "subscription_plans" ADD COLUMN IF NOT EXISTS "automation_limit" integer DEFAULT 0;`,
    `ALTER TABLE "subscription_plans" ADD COLUMN IF NOT EXISTS "api_request_limit" integer DEFAULT 0;`,
    `ALTER TABLE "subscription_plans" ADD COLUMN IF NOT EXISTS "context_limit" bigint DEFAULT 0;`,
    `ALTER TABLE "subscription_plans" ADD COLUMN IF NOT EXISTS "mcp_server_limit" integer DEFAULT 0;`,
    `ALTER TABLE "subscription_plans" ADD COLUMN IF NOT EXISTS "mcp_tool_limit" integer DEFAULT 0;`,
    `ALTER TABLE "subscription_plans" ADD COLUMN IF NOT EXISTS "mcp_request_limit" integer DEFAULT 0;`,

    // Enables
    `ALTER TABLE "subscription_plans" ADD COLUMN IF NOT EXISTS "knowledge_base_enabled" boolean DEFAULT false;`,
    `ALTER TABLE "subscription_plans" ADD COLUMN IF NOT EXISTS "database_intelligence_enabled" boolean DEFAULT false;`,
    `ALTER TABLE "subscription_plans" ADD COLUMN IF NOT EXISTS "automation_studio_enabled" boolean DEFAULT false;`,
    `ALTER TABLE "subscription_plans" ADD COLUMN IF NOT EXISTS "api_access_enabled" boolean DEFAULT false;`,
    `ALTER TABLE "subscription_plans" ADD COLUMN IF NOT EXISTS "mcp_enabled" boolean DEFAULT false;`,
    `ALTER TABLE "subscription_plans" ADD COLUMN IF NOT EXISTS "byok_enabled" boolean DEFAULT false;`,
    `ALTER TABLE "subscription_plans" ADD COLUMN IF NOT EXISTS "priority_support_enabled" boolean DEFAULT false;`,
    
    // Also other tables that might be missing from 0008
    `CREATE TABLE IF NOT EXISTS "billing_events" (
      "id" serial PRIMARY KEY NOT NULL,
      "user_id" uuid NOT NULL,
      "amount" integer NOT NULL,
      "currency" varchar(10) DEFAULT 'USD' NOT NULL,
      "event_type" varchar(100) NOT NULL,
      "paddle_transaction_id" varchar(255),
      "metadata" jsonb,
      "created_at" timestamp DEFAULT now()
    );`,
    
    `CREATE TABLE IF NOT EXISTS "usage_counters" (
      "id" serial PRIMARY KEY NOT NULL,
      "user_id" uuid NOT NULL,
      "month" varchar(7) NOT NULL,
      "api_requests" integer DEFAULT 0 NOT NULL,
      "kb_count" integer DEFAULT 0 NOT NULL,
      "database_count" integer DEFAULT 0 NOT NULL,
      "automation_count" integer DEFAULT 0 NOT NULL,
      "mcp_count" integer DEFAULT 0 NOT NULL,
      "context_used" bigint DEFAULT 0 NOT NULL,
      "artifacts_generated" integer DEFAULT 0 NOT NULL,
      "updated_at" timestamp DEFAULT now()
    );`,
    
    `CREATE TABLE IF NOT EXISTS "user_subscriptions" (
      "id" serial PRIMARY KEY NOT NULL,
      "user_id" uuid NOT NULL,
      "plan_id" integer,
      "status" varchar(50) NOT NULL,
      "billing_cycle" varchar(50),
      "paddle_customer_id" varchar(255),
      "paddle_subscription_id" varchar(255),
      "started_at" timestamp,
      "renews_at" timestamp,
      "expires_at" timestamp,
      "created_at" timestamp DEFAULT now(),
      "updated_at" timestamp DEFAULT now()
    );`,

    `ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "paddle_customer_id" varchar(255);`,
    `ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "paddle_subscription_id" varchar(255);`,
    `ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "paddle_subscription_status" varchar(50);`,
  ];

  for (const statement of statements) {
    try {
      await db.execute(sql.raw(statement));
      console.log(`Executed: ${statement.slice(0, 50)}...`);
    } catch (e: any) {
      console.error(`Error executing statement: ${statement.slice(0, 50)}...`);
      console.error(e.message || e);
    }
  }
  console.log("Migration fix complete.");
  process.exit(0);
}

main().catch(console.error);
