ALTER TABLE "baseparse_pricing_plans" RENAME COLUMN "price_cents" TO "price_usd_cents";
ALTER TABLE "baseparse_pricing_plans" ALTER COLUMN "price_usd_cents" SET DEFAULT 0;

ALTER TABLE "baseparse_pricing_plans" ADD COLUMN "price_inr_paise" integer DEFAULT 0 NOT NULL;
ALTER TABLE "baseparse_pricing_plans" ADD COLUMN "discount_usd_cents" integer DEFAULT 0;
ALTER TABLE "baseparse_pricing_plans" ADD COLUMN "discount_inr_paise" integer DEFAULT 0;
ALTER TABLE "baseparse_pricing_plans" ADD COLUMN "paypal_plan_id" varchar(255);
ALTER TABLE "baseparse_pricing_plans" ADD COLUMN "cashfree_plan_id" varchar(255);
