CREATE TABLE "automation_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" integer,
	"status" varchar(50) NOT NULL,
	"logs" text,
	"artifact_id" integer,
	"source_snapshot" jsonb,
	"started_at" timestamp DEFAULT now(),
	"finished_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "automation_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(100) NOT NULL,
	"template_id" varchar(100),
	"sources" jsonb,
	"artifact_types" jsonb,
	"execution_mode" varchar(50) DEFAULT 'manual' NOT NULL,
	"schedule" varchar(100),
	"trigger_event" varchar(100),
	"goal" text,
	"status" varchar(50) DEFAULT 'active',
	"last_run_at" timestamp,
	"next_run_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "connected_databases" (
	"id" serial PRIMARY KEY NOT NULL,
	"kb_id" integer,
	"name" varchar(255) NOT NULL,
	"engine" varchar(50) NOT NULL,
	"connection_string" text,
	"host" varchar(255),
	"port" integer,
	"database_name" varchar(255),
	"username" varchar(255),
	"password" text,
	"access_mode" varchar(50) DEFAULT 'read_only',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "database_schemas" (
	"id" serial PRIMARY KEY NOT NULL,
	"database_id" integer,
	"schema_data" jsonb NOT NULL,
	"extracted_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "promotions" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"description" text,
	"type" varchar(50) NOT NULL,
	"value" jsonb,
	"is_active" boolean DEFAULT true,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "promotions_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "system_config" (
	"key" varchar(255) PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "is_admin" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "is_active" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "user_role" varchar(50);--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "social_url" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "country" varchar(100);--> statement-breakpoint
ALTER TABLE "automation_logs" ADD CONSTRAINT "automation_logs_task_id_automation_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."automation_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_logs" ADD CONSTRAINT "automation_logs_artifact_id_workspace_artifacts_id_fk" FOREIGN KEY ("artifact_id") REFERENCES "public"."workspace_artifacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_tasks" ADD CONSTRAINT "automation_tasks_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connected_databases" ADD CONSTRAINT "connected_databases_kb_id_knowledge_bases_id_fk" FOREIGN KEY ("kb_id") REFERENCES "public"."knowledge_bases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "database_schemas" ADD CONSTRAINT "database_schemas_database_id_connected_databases_id_fk" FOREIGN KEY ("database_id") REFERENCES "public"."connected_databases"("id") ON DELETE cascade ON UPDATE no action;