import { config } from 'dotenv';
config({ path: '.env.local' });
import { db } from '../db/index';
import { sql } from 'drizzle-orm';

async function migrate() {
  console.log('Creating automation_outputs table...');
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "automation_outputs" (
      "id" serial PRIMARY KEY NOT NULL,
      "user_id" uuid NOT NULL,
      "kb_id" integer,
      "module" varchar(100) NOT NULL,
      "template" varchar(100) NOT NULL,
      "title" varchar(255) NOT NULL,
      "status" varchar(50) DEFAULT 'draft',
      "credits_used" integer DEFAULT 0,
      "provider" varchar(50),
      "billing_mode" varchar(50),
      "duration_ms" integer,
      "created_at" timestamp DEFAULT now(),
      "updated_at" timestamp DEFAULT now()
    );
  `);
  
  // Add foreign keys separately if they don't exist
  try {
    await db.execute(sql`
      ALTER TABLE "automation_outputs" ADD CONSTRAINT "automation_outputs_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
    `);
  } catch(e) {}
  
  try {
    await db.execute(sql`
      ALTER TABLE "automation_outputs" ADD CONSTRAINT "automation_outputs_kb_id_knowledge_bases_id_fk" FOREIGN KEY ("kb_id") REFERENCES "public"."knowledge_bases"("id") ON DELETE set null ON UPDATE no action;
    `);
  } catch(e) {}

  console.log('Creating automation_output_versions table...');
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "automation_output_versions" (
      "id" serial PRIMARY KEY NOT NULL,
      "output_id" integer NOT NULL,
      "version_number" integer NOT NULL,
      "content" text NOT NULL,
      "format" varchar(50) DEFAULT 'markdown' NOT NULL,
      "created_at" timestamp DEFAULT now()
    );
  `);
  
  try {
    await db.execute(sql`
      ALTER TABLE "automation_output_versions" ADD CONSTRAINT "automation_output_versions_output_id_automation_outputs_id_fk" FOREIGN KEY ("output_id") REFERENCES "public"."automation_outputs"("id") ON DELETE cascade ON UPDATE no action;
    `);
  } catch(e) {}

  console.log('Migration complete!');
  process.exit(0);
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
