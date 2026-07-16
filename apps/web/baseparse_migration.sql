CREATE TABLE "baseparse_pricing_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"price_cents" integer NOT NULL,
	"page_extraction_limit" integer NOT NULL,
	"paddle_product_id" varchar(255),
	"paddle_price_id" varchar(255),
	"is_active" boolean DEFAULT true,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
