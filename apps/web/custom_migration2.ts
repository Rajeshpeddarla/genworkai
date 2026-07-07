import { config } from 'dotenv';
config({ path: '.env.local' });
import { db } from './db/index';
import { sql } from 'drizzle-orm';

async function main() {
  console.log("Running manual migration...");

  try {
    console.log("Adding endpoint_limit to subscription_plans...");
    await db.execute(sql.raw(`ALTER TABLE "subscription_plans" ADD COLUMN IF NOT EXISTS "endpoint_limit" integer DEFAULT 0;`));
    console.log("Success.");
  } catch (e: any) {
    console.log("Skipped or error (might already exist):", e.message);
  }

  try {
    console.log("Creating api_endpoints table...");
    await db.execute(sql.raw(`
      CREATE TABLE IF NOT EXISTS "api_endpoints" (
        "id" serial PRIMARY KEY NOT NULL,
        "workspace_id" integer,
        "user_id" uuid NOT NULL,
        "name" varchar(255) NOT NULL,
        "description" text,
        "slug" varchar(255) NOT NULL,
        "version" integer DEFAULT 1,
        "method" varchar(50) DEFAULT 'POST',
        "endpoint_type" varchar(100),
        "knowledge_sources" jsonb,
        "workflow" jsonb,
        "input_schema" jsonb,
        "output_schema" jsonb,
        "system_prompt" text,
        "temperature" numeric(3, 2),
        "max_tokens" integer,
        "stream_enabled" boolean DEFAULT false,
        "authentication_type" varchar(50) DEFAULT 'api_key',
        "requests_per_minute" integer DEFAULT 60,
        "daily_quota" integer,
        "monthly_quota" integer,
        "timeout" integer DEFAULT 30,
        "is_published" boolean DEFAULT false,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        CONSTRAINT "api_endpoints_slug_unique" UNIQUE("slug")
      );
    `));
    
    // Add foreign key constraint for user_id
    await db.execute(sql.raw(`
      DO $$ BEGIN
        ALTER TABLE "api_endpoints" ADD CONSTRAINT "api_endpoints_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `));

    console.log("Success.");
  } catch (e: any) {
    console.log("Error creating table:", e.message);
  }

  console.log("Manual migration complete.");
  process.exit(0);
}

main().catch(console.error);
