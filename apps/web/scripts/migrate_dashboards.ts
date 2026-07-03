import { config } from 'dotenv';
config({ path: '.env.local' });
// Must dynamically import db because imports are hoisted and db needs the env var
async function main() {
  const { db } = await import('../db/index.js');
  const { sql } = await import('drizzle-orm');
  const statements = [
    `CREATE TABLE IF NOT EXISTS "dashboards" (
      "id" serial PRIMARY KEY NOT NULL,
      "user_id" uuid NOT NULL,
      "data_source_id" integer,
      "name" varchar(255) NOT NULL,
      "description" text,
      "icon" varchar(50),
      "cover_color" varchar(50),
      "is_ai_generated" boolean DEFAULT false,
      "is_template" boolean DEFAULT false,
      "global_filters_config" jsonb,
      "is_favorite" boolean DEFAULT false,
      "is_archived" boolean DEFAULT false,
      "created_at" timestamp DEFAULT now(),
      "updated_at" timestamp DEFAULT now()
    );`,
    `CREATE TABLE IF NOT EXISTS "dashboard_versions" (
      "id" serial PRIMARY KEY NOT NULL,
      "dashboard_id" integer NOT NULL,
      "version_number" integer NOT NULL,
      "layout_snapshot" jsonb NOT NULL,
      "created_at" timestamp DEFAULT now(),
      "created_by" uuid
    );`,
    `CREATE TABLE IF NOT EXISTS "dashboard_widgets" (
      "id" serial PRIMARY KEY NOT NULL,
      "dashboard_id" integer NOT NULL,
      "name" varchar(255) NOT NULL,
      "description" text,
      "widget_type" varchar(50) NOT NULL,
      "sql_query" text,
      "refresh_interval" varchar(50) DEFAULT 'manual',
      "visualization_config" jsonb,
      "layout_config" jsonb,
      "last_refreshed_at" timestamp,
      "last_execution_time" integer,
      "created_at" timestamp DEFAULT now(),
      "updated_at" timestamp DEFAULT now()
    );`,
    `CREATE TABLE IF NOT EXISTS "dashboard_widget_cache" (
      "widget_id" integer PRIMARY KEY NOT NULL,
      "data" jsonb,
      "hash" varchar(255),
      "updated_at" timestamp DEFAULT now()
    );`,
    `ALTER TABLE "dashboards" ADD CONSTRAINT "dashboards_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;`,
    `ALTER TABLE "dashboards" ADD CONSTRAINT "dashboards_data_source_id_connected_databases_id_fk" FOREIGN KEY ("data_source_id") REFERENCES "public"."connected_databases"("id") ON DELETE cascade ON UPDATE no action;`,
    `ALTER TABLE "dashboard_versions" ADD CONSTRAINT "dashboard_versions_dashboard_id_dashboards_id_fk" FOREIGN KEY ("dashboard_id") REFERENCES "public"."dashboards"("id") ON DELETE cascade ON UPDATE no action;`,
    `ALTER TABLE "dashboard_versions" ADD CONSTRAINT "dashboard_versions_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;`,
    `ALTER TABLE "dashboard_widgets" ADD CONSTRAINT "dashboard_widgets_dashboard_id_dashboards_id_fk" FOREIGN KEY ("dashboard_id") REFERENCES "public"."dashboards"("id") ON DELETE cascade ON UPDATE no action;`,
    `ALTER TABLE "dashboard_widget_cache" ADD CONSTRAINT "dashboard_widget_cache_widget_id_dashboard_widgets_id_fk" FOREIGN KEY ("widget_id") REFERENCES "public"."dashboard_widgets"("id") ON DELETE cascade ON UPDATE no action;`
  ];

  for (const statement of statements) {
    try {
      await db.execute(sql.raw(statement));
      console.log(`Executed: ${statement.slice(0, 50)}...`);
    } catch (e: any) {
      if (e.message && e.message.includes('already exists')) {
        console.log(`Skipped existing: ${statement.slice(0, 50)}...`);
      } else {
        console.error(`Error executing statement: ${statement.slice(0, 50)}...`);
        console.error(e.message || e);
      }
    }
  }
  console.log("Migration complete.");
  process.exit(0);
}

main().catch(console.error);
