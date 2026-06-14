CREATE TABLE "business_features" (
	"id" serial PRIMARY KEY NOT NULL,
	"kb_id" integer,
	"name" varchar(255) NOT NULL,
	"description" text,
	"parent_id" integer,
	"level" varchar(50),
	"document_ids" jsonb,
	"is_manual_override" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "business_flows" (
	"id" serial PRIMARY KEY NOT NULL,
	"kb_id" integer,
	"name" varchar(255) NOT NULL,
	"description" text,
	"steps" jsonb,
	"is_manual_override" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "mcp_api_keys" (
	"id" serial PRIMARY KEY NOT NULL,
	"server_id" integer,
	"key_hash" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"permission_level" varchar(50) DEFAULT 'read_only',
	"created_at" timestamp DEFAULT now(),
	"last_used_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "mcp_audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"server_id" integer,
	"api_key_id" integer,
	"tool_name" varchar(255) NOT NULL,
	"request_payload" jsonb,
	"response_status" varchar(50),
	"duration_ms" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "mcp_servers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"kb_ids" jsonb,
	"enabled_capabilities" jsonb,
	"status" varchar(50) DEFAULT 'active',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"full_name" varchar(255),
	"avatar_url" text,
	"tier" varchar(50) DEFAULT 'free',
	"referral_code" varchar(50),
	"referred_by" varchar(50),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "profiles_email_unique" UNIQUE("email"),
	CONSTRAINT "profiles_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
ALTER TABLE "business_features" ADD CONSTRAINT "business_features_kb_id_knowledge_bases_id_fk" FOREIGN KEY ("kb_id") REFERENCES "public"."knowledge_bases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_flows" ADD CONSTRAINT "business_flows_kb_id_knowledge_bases_id_fk" FOREIGN KEY ("kb_id") REFERENCES "public"."knowledge_bases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_api_keys" ADD CONSTRAINT "mcp_api_keys_server_id_mcp_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."mcp_servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_audit_logs" ADD CONSTRAINT "mcp_audit_logs_server_id_mcp_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."mcp_servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_audit_logs" ADD CONSTRAINT "mcp_audit_logs_api_key_id_mcp_api_keys_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "public"."mcp_api_keys"("id") ON DELETE set null ON UPDATE no action;