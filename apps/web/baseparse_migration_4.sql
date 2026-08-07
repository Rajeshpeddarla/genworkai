CREATE TABLE "public"."baseparse_promotions" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "name" text NOT NULL,
    "discount_type" text NOT NULL, -- 'percentage' or 'fixed_amount'
    "discount_value" integer NOT NULL, -- percentage (0-100) or cents/paise
    "country_code" text, -- e.g., 'IN', 'US', or NULL/ALL for everywhere
    "offer_type" text NOT NULL, -- 'signup_first_month', 'festival_bonus', 'normal'
    "target_plan_id" bigint REFERENCES "public"."baseparse_pricing_plans"("id") ON DELETE CASCADE, -- specific plan, or NULL for all plans
    "is_active" boolean NOT NULL DEFAULT true,
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

-- Enable RLS
ALTER TABLE "public"."baseparse_promotions" ENABLE ROW LEVEL SECURITY;

-- Allow read access to anyone
CREATE POLICY "Enable read access for all users" ON "public"."baseparse_promotions" AS PERMISSIVE FOR SELECT TO public USING (true);
