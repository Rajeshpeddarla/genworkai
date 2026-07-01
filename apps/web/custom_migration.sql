CREATE TABLE "request_pack_products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"price_cents" integer NOT NULL,
	"request_count" integer NOT NULL,
	"paddle_product_id" varchar(255),
	"paddle_price_id" varchar(255),
	"is_active" boolean DEFAULT true,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
CREATE TABLE "user_request_packs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"pack_id" integer,
	"paddle_transaction_id" varchar(255),
	"purchased_requests" integer NOT NULL,
	"remaining_requests" integer NOT NULL,
	"status" varchar(50) DEFAULT 'active',
	"purchased_at" timestamp DEFAULT now(),
	"expires_at" timestamp
);
CREATE TABLE "user_usage_balance" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"monthly_remaining_requests" integer DEFAULT 0,
	"purchased_remaining_requests" integer DEFAULT 0,
	"monthly_reset_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_usage_balance_user_id_unique" UNIQUE("user_id")
);
ALTER TABLE "subscription_plans" ADD COLUMN "concurrency_limit" integer DEFAULT 5;
ALTER TABLE "subscription_plans" ADD COLUMN "rate_limit" integer DEFAULT 60;
ALTER TABLE "user_request_packs" ADD CONSTRAINT "user_request_packs_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "user_request_packs" ADD CONSTRAINT "user_request_packs_pack_id_request_pack_products_id_fk" FOREIGN KEY ("pack_id") REFERENCES "public"."request_pack_products"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "user_usage_balance" ADD CONSTRAINT "user_usage_balance_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
