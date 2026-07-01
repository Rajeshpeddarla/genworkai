import { config } from 'dotenv';
config({ path: '.env.local' });
import { db } from '../db/index';
import { sql } from 'drizzle-orm';

async function main() {
  console.log("Applying AI Credit Schema Migration...");
  
  const statements = [
    `ALTER TABLE "subscription_plans" ADD COLUMN "monthly_ai_credits" integer DEFAULT 0;`,
    
    `DROP TABLE IF EXISTS "user_request_packs" CASCADE;`,
    `DROP TABLE IF EXISTS "request_pack_products" CASCADE;`,
    `DROP TABLE IF EXISTS "user_usage_balance" CASCADE;`,

    `CREATE TABLE IF NOT EXISTS "user_ai_credit_balance" (
      "id" serial PRIMARY KEY NOT NULL,
      "user_id" uuid NOT NULL,
      "monthly_remaining_credits" integer DEFAULT 0,
      "purchased_remaining_credits" integer DEFAULT 0,
      "monthly_reset_at" timestamp DEFAULT now(),
      "updated_at" timestamp DEFAULT now(),
      CONSTRAINT "user_ai_credit_balance_user_id_unique" UNIQUE("user_id")
    );`,

    `CREATE TABLE IF NOT EXISTS "ai_credit_pack_products" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" varchar(100) NOT NULL,
      "description" text,
      "credits" integer NOT NULL,
      "price_cents" integer NOT NULL,
      "paddle_product_id" varchar(255),
      "paddle_price_id" varchar(255),
      "display_order" integer DEFAULT 0,
      "badge" varchar(50),
      "is_featured" boolean DEFAULT false,
      "is_active" boolean DEFAULT true,
      "created_at" timestamp DEFAULT now(),
      "updated_at" timestamp DEFAULT now()
    );`,

    `CREATE TABLE IF NOT EXISTS "user_ai_credit_purchases" (
      "id" serial PRIMARY KEY NOT NULL,
      "user_id" uuid NOT NULL,
      "purchased_credits" integer NOT NULL,
      "remaining_credits" integer NOT NULL,
      "paddle_transaction_id" varchar(255),
      "status" varchar(50) DEFAULT 'active',
      "purchased_at" timestamp DEFAULT now(),
      "expires_at" timestamp,
      "created_at" timestamp DEFAULT now()
    );`,

    `CREATE TABLE IF NOT EXISTS "ai_credit_costs" (
      "id" serial PRIMARY KEY NOT NULL,
      "operation_key" varchar(100) NOT NULL,
      "display_name" varchar(100) NOT NULL,
      "credits" integer NOT NULL,
      "category" varchar(50),
      "description" text,
      "is_active" boolean DEFAULT true,
      "created_at" timestamp DEFAULT now(),
      CONSTRAINT "ai_credit_costs_operation_key_unique" UNIQUE("operation_key")
    );`,

    `CREATE TABLE IF NOT EXISTS "ai_usage_history" (
      "id" serial PRIMARY KEY NOT NULL,
      "user_id" uuid NOT NULL,
      "workspace_id" integer,
      "operation_key" varchar(100) NOT NULL,
      "credits_used" integer NOT NULL,
      "status" varchar(50) DEFAULT 'success',
      "duration_ms" integer,
      "created_at" timestamp DEFAULT now()
    );`,

    // Add Foreign Keys
    `DO $$ BEGIN
     ALTER TABLE "user_ai_credit_balance" ADD CONSTRAINT "user_ai_credit_balance_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION
     WHEN duplicate_object THEN null;
    END $$;`,

    `DO $$ BEGIN
     ALTER TABLE "user_ai_credit_purchases" ADD CONSTRAINT "user_ai_credit_purchases_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION
     WHEN duplicate_object THEN null;
    END $$;`,

    `DO $$ BEGIN
     ALTER TABLE "ai_usage_history" ADD CONSTRAINT "ai_usage_history_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION
     WHEN duplicate_object THEN null;
    END $$;`
  ];

  for (const stmt of statements) {
    try {
      await db.execute(sql.raw(stmt));
      console.log("Success:", stmt.split('(')[0]?.trim() || stmt);
    } catch(e: any) {
      console.error("Failed:", stmt.split('(')[0]?.trim() || stmt);
      console.error(e.message);
    }
  }

  // Delete previous snapshot files so drizzle-kit can generate a fresh one without prompts next time
  console.log("Done.");
  process.exit(0);
}

main().catch(console.error);
