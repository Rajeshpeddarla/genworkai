import { db } from "@/db";
import { subscriptionPlans, userSubscriptions, billingEvents, profiles, aiCreditPackProducts, userAiCreditBalance, aiCreditCosts, baseparsePricingPlans } from "@/db/schema";
import BillingClient from "./BillingClient";
import { eq, desc } from "drizzle-orm";
import { fetchPaddleData } from "./actions";

export default async function BillingStudioPage() {
  const plans = await db.select().from(subscriptionPlans).orderBy(subscriptionPlans.monthlyPrice);
  
  const subscriptions = await db.select({
    id: userSubscriptions.id,
    status: userSubscriptions.status,
    planId: userSubscriptions.planId,
    billingCycle: userSubscriptions.billingCycle,
    createdAt: userSubscriptions.createdAt,
    user: {
      id: profiles.id,
      fullName: profiles.fullName,
      email: profiles.email
    }
  }).from(userSubscriptions)
  .leftJoin(profiles, eq(userSubscriptions.userId, profiles.id))
  .orderBy(desc(userSubscriptions.createdAt))
  .limit(50);

  const events = await db.select().from(billingEvents).orderBy(desc(billingEvents.createdAt)).limit(50);

  const packs = await db.select().from(aiCreditPackProducts).orderBy(aiCreditPackProducts.displayOrder);
  
  const balances = await db.select({
    userId: userAiCreditBalance.userId,
    monthlyRemainingCredits: userAiCreditBalance.monthlyRemainingCredits,
    purchasedRemainingCredits: userAiCreditBalance.purchasedRemainingCredits,
    user: {
      fullName: profiles.fullName,
      email: profiles.email
    }
  }).from(userAiCreditBalance)
  .leftJoin(profiles, eq(userAiCreditBalance.userId, profiles.id))
  .limit(50);

  const paddleData = await fetchPaddleData();
  const costs = await db.select().from(aiCreditCosts);
  const { systemConfig } = await import("@/db/schema");
  const sysConfigs = await db.select().from(systemConfig);

  const providerCosts = {
    creditValueUSD: parseFloat(String(sysConfigs.find(c => c.key === 'credit_value_usd')?.value || '0.01')),
    deepseekInput: parseFloat(String(sysConfigs.find(c => c.key === 'deepseek_input_cost')?.value || '0.14')),
    deepseekOutput: parseFloat(String(sysConfigs.find(c => c.key === 'deepseek_output_cost')?.value || '0.28')),
    jinaEmbedding: parseFloat(String(sysConfigs.find(c => c.key === 'jina_embedding_cost')?.value || '0.02')),
    jinaReranker: parseFloat(String(sysConfigs.find(c => c.key === 'jina_reranker_cost')?.value || '0.02')),
  };

  const serializedPlans = JSON.parse(JSON.stringify(plans));
  const serializedSubscriptions = JSON.parse(JSON.stringify(subscriptions));
  const serializedEvents = JSON.parse(JSON.stringify(events));
  const serializedPacks = JSON.parse(JSON.stringify(packs));
  const serializedBalances = JSON.parse(JSON.stringify(balances));
  const serializedCosts = JSON.parse(JSON.stringify(costs));
  
  const baseparsePlans = await db.select().from(baseparsePricingPlans).orderBy(baseparsePricingPlans.displayOrder);
  const serializedBaseparsePlans = JSON.parse(JSON.stringify(baseparsePlans));

  return <BillingClient 
    initialPlans={serializedPlans} 
    subscriptions={serializedSubscriptions} 
    events={serializedEvents} 
    paddleData={paddleData.success ? paddleData : null}
    initialPacks={serializedPacks}
    userBalances={serializedBalances}
    initialCosts={serializedCosts}
    initialProviderCosts={providerCosts}
    initialBaseparsePlans={serializedBaseparsePlans}
  />;
}
