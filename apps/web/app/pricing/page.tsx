import { db } from "@/db";
import { subscriptionPlans, promotionTemplates } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import PricingClient from "./pricing-client";

export default async function PricingPage() {
  const allPlans = await db.select().from(subscriptionPlans)
    .where(eq(subscriptionPlans.isActive, true)); // only active plans
  
  // Get active promos
  const promos = await db.select().from(promotionTemplates)
    .where(eq(promotionTemplates.isActive, true));
    
  // Filter out expired promos in JS to handle nulls easier
  const activePromo = promos.find(p => !p.expiresAt || new Date(p.expiresAt) > new Date());

  return <PricingClient plans={allPlans} activePromo={activePromo} />;
}
