CREATE TABLE "api_keys" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid,
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
--> statement-breakpoint
CREATE TABLE "api_usage_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"api_key_id" integer,
	"endpoint" varchar(255) NOT NULL,
	"resource_type" varchar(50),
	"resource_id" integer,
	"status" integer DEFAULT 200,
	"duration_ms" integer,
	"metrics" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_usage_logs" ADD CONSTRAINT "api_usage_logs_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_usage_logs" ADD CONSTRAINT "api_usage_logs_api_key_id_api_keys_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "public"."api_keys"("id") ON DELETE set null ON UPDATE no action;