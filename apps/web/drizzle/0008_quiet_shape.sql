CREATE TABLE "admin_audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"admin_id" uuid,
	"action" varchar(255) NOT NULL,
	"entity_type" varchar(100),
	"entity_id" varchar(255),
	"previous_value" jsonb,
	"new_value" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ai_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"workspace_model_id" integer,
	"knowledge_model_id" integer,
	"database_model_id" integer,
	"automation_model_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "ai_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "api_usage_counters" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"period" varchar(7) NOT NULL,
	"requests" integer DEFAULT 0 NOT NULL,
	"llm_tokens" integer DEFAULT 0 NOT NULL,
	"db_queries" integer DEFAULT 0 NOT NULL,
	"vector_searches" integer DEFAULT 0 NOT NULL,
	"generated_artifacts" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "billing_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"paddle_transaction_id" varchar(255),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "database_query_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"database_id" integer NOT NULL,
	"question" text,
	"generated_sql" text,
	"execution_time_ms" integer,
	"row_count" integer,
	"success" boolean DEFAULT true,
	"error" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "feature_flags" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"is_enabled" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "feature_flags_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "github_installations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"installation_id" integer NOT NULL,
	"account_name" varchar(255),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "github_installations_installation_id_unique" UNIQUE("installation_id")
);
--> statement-breakpoint
CREATE TABLE "mcp_api_keys" (
	"id" serial PRIMARY KEY NOT NULL,
	"server_id" integer,
	"key_hash" varchar(255) NOT NULL,
	"key_prefix" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'active',
	"created_at" timestamp DEFAULT now(),
	"last_used_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "promotion_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"description" text,
	"type" varchar(50) NOT NULL,
	"value" jsonb,
	"duration" integer,
	"is_active" boolean DEFAULT true,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "promotion_templates_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "subscription_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"description" text,
	"monthly_price" integer DEFAULT 0,
	"yearly_price" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"paddle_product_id" varchar(255),
	"paddle_monthly_price_id" varchar(255),
	"paddle_yearly_price_id" varchar(255),
	"knowledge_base_limit" integer DEFAULT 0,
	"database_limit" integer DEFAULT 0,
	"workspace_limit" integer DEFAULT 0,
	"automation_limit" integer DEFAULT 0,
	"api_request_limit" integer DEFAULT 0,
	"context_limit" bigint DEFAULT 0,
	"mcp_server_limit" integer DEFAULT 0,
	"mcp_tool_limit" integer DEFAULT 0,
	"mcp_request_limit" integer DEFAULT 0,
	"knowledge_base_enabled" boolean DEFAULT false,
	"database_intelligence_enabled" boolean DEFAULT false,
	"automation_studio_enabled" boolean DEFAULT false,
	"api_access_enabled" boolean DEFAULT false,
	"mcp_enabled" boolean DEFAULT false,
	"byok_enabled" boolean DEFAULT false,
	"priority_support_enabled" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "subscription_plans_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "ticket_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticket_id" uuid NOT NULL,
	"sender_id" uuid,
	"is_agent" boolean DEFAULT false NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "usage_counters" (
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
);
--> statement-breakpoint
CREATE TABLE "user_llm_keys" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" varchar(50) NOT NULL,
	"api_key" text NOT NULL,
	"base_url" text,
	"default_model" varchar(100),
	"scope" varchar(50) DEFAULT 'personal',
	"status" varchar(50) DEFAULT 'active',
	"last_validated_at" timestamp,
	"last_error" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_subscriptions" (
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
);
--> statement-breakpoint
ALTER TABLE "document_chunks" ADD COLUMN "hash" varchar(64);--> statement-breakpoint
ALTER TABLE "knowledge_sources" ADD COLUMN "progress" jsonb;--> statement-breakpoint
ALTER TABLE "knowledge_sources" ADD COLUMN "last_successful_hash" varchar(255);--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "paddle_customer_id" varchar(255);--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "paddle_subscription_id" varchar(255);--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "paddle_subscription_status" varchar(50);--> statement-breakpoint
ALTER TABLE "sync_jobs" ADD COLUMN "progress" jsonb;--> statement-breakpoint
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_admin_id_profiles_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_profiles" ADD CONSTRAINT "ai_profiles_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_profiles" ADD CONSTRAINT "ai_profiles_workspace_model_id_user_llm_keys_id_fk" FOREIGN KEY ("workspace_model_id") REFERENCES "public"."user_llm_keys"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_profiles" ADD CONSTRAINT "ai_profiles_knowledge_model_id_user_llm_keys_id_fk" FOREIGN KEY ("knowledge_model_id") REFERENCES "public"."user_llm_keys"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_profiles" ADD CONSTRAINT "ai_profiles_database_model_id_user_llm_keys_id_fk" FOREIGN KEY ("database_model_id") REFERENCES "public"."user_llm_keys"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_profiles" ADD CONSTRAINT "ai_profiles_automation_model_id_user_llm_keys_id_fk" FOREIGN KEY ("automation_model_id") REFERENCES "public"."user_llm_keys"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_usage_counters" ADD CONSTRAINT "api_usage_counters_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_events" ADD CONSTRAINT "billing_events_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "database_query_logs" ADD CONSTRAINT "database_query_logs_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "database_query_logs" ADD CONSTRAINT "database_query_logs_database_id_connected_databases_id_fk" FOREIGN KEY ("database_id") REFERENCES "public"."connected_databases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "github_installations" ADD CONSTRAINT "github_installations_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_api_keys" ADD CONSTRAINT "mcp_api_keys_server_id_mcp_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."mcp_servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_sender_id_profiles_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_counters" ADD CONSTRAINT "usage_counters_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_llm_keys" ADD CONSTRAINT "user_llm_keys_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_plan_id_subscription_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE restrict ON UPDATE no action;