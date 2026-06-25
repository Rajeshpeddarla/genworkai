import { config } from 'dotenv';
config({ path: '.env.local' });
import { db } from './db/index';
import { sql } from 'drizzle-orm';

async function main() {
  console.log("Creating api_keys and api_usage_logs tables manually...");

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "api_keys" (
      "id" serial PRIMARY KEY NOT NULL,
      "user_id" uuid REFERENCES "profiles"("id") ON DELETE cascade,
      "key_hash" varchar(255) NOT NULL,
      "key_prefix" varchar(50) NOT NULL,
      "name" varchar(255) NOT NULL,
      "scopes" jsonb DEFAULT '[]'::jsonb,
      "resource_scopes" jsonb,
      "status" varchar(50) DEFAULT 'active',
      "created_at" timestamp DEFAULT now(),
      "expires_at" timestamp,
      "last_used_at" timestamp
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "api_usage_logs" (
      "id" serial PRIMARY KEY NOT NULL,
      "user_id" uuid REFERENCES "profiles"("id") ON DELETE cascade,
      "api_key_id" integer REFERENCES "api_keys"("id") ON DELETE set null,
      "endpoint" varchar(255) NOT NULL,
      "resource_type" varchar(50),
      "resource_id" integer,
      "status" integer DEFAULT 200,
      "duration_ms" integer,
      "created_at" timestamp DEFAULT now()
    );
  `);

  console.log("Tables created successfully!");
  process.exit(0);
}

main().catch(console.error);
