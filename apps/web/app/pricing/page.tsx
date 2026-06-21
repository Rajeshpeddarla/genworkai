import { db } from "@/db";
import { subscriptionPlans, promotionTemplates } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import PricingClient from "./pricing-client";

export default async function PricingPage() {
  const allPlans = await db.select().from(subscriptionPlans);
  
  // Sort plans specifically: Free, Starter, Pro, Agency, Enterprise
  const sortOrder = ['free', 'starter', 'pro', 'agency', 'enterprise'];
  const plans = allPlans.sort((a, b) => sortOrder.indexOf(a.slug) - sortOrder.indexOf(b.slug));
  
  // Get active promos
  const promos = await db.select().from(promotionTemplates)
    .where(eq(promotionTemplates.isActive, true));
    
  // Filter out expired promos in JS to handle nulls easier
  const activePromo = promos.find(p => !p.expiresAt || new Date(p.expiresAt) > new Date());

  return <PricingClient plans={plans} activePromo={activePromo} />;
}
