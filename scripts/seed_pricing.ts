import { db } from "../apps/web/db";
import { subscriptionPlans, promotionTemplates } from "../apps/web/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Seeding Subscription Plans...");

  const plans = [
    {
      name: "Free",
      slug: "free",
      description: "For individuals exploring the platform",
      monthlyPrice: 0,
      yearlyPrice: 0,
      isActive: true,
      knowledgeBaseLimit: 1,
      databaseLimit: 1,
      workspaceLimit: 1,
      automationLimit: 0,
      apiRequestLimit: 1000,
      contextLimit: 1000000, // 1MB
      mcpServerLimit: 0,
      mcpToolLimit: 0,
      mcpRequestLimit: 0,
      knowledgeBaseEnabled: true,
      databaseIntelligenceEnabled: true,
      automationStudioEnabled: false,
      apiAccessEnabled: true,
      mcpEnabled: false,
      byokEnabled: false,
      prioritySupportEnabled: false,
    },
    {
      name: "Starter",
      slug: "starter",
      description: "For small teams building side projects",
      monthlyPrice: 2900,
      yearlyPrice: 29000,
      isActive: true,
      knowledgeBaseLimit: 3,
      databaseLimit: 3,
      workspaceLimit: 3,
      automationLimit: 5,
      apiRequestLimit: 10000,
      contextLimit: 5000000, // 5MB
      mcpServerLimit: 1,
      mcpToolLimit: 5,
      mcpRequestLimit: 5000,
      knowledgeBaseEnabled: true,
      databaseIntelligenceEnabled: true,
      automationStudioEnabled: true,
      apiAccessEnabled: true,
      mcpEnabled: true,
      byokEnabled: false,
      prioritySupportEnabled: false,
    },
    {
      name: "Pro",
      slug: "pro",
      description: "For professionals needing scalable intelligence",
      monthlyPrice: 9900,
      yearlyPrice: 99000,
      isActive: true,
      knowledgeBaseLimit: 10,
      databaseLimit: 10,
      workspaceLimit: 10,
      automationLimit: 20,
      apiRequestLimit: 100000,
      contextLimit: 25000000, // 25MB
      mcpServerLimit: 5,
      mcpToolLimit: 20,
      mcpRequestLimit: 50000,
      knowledgeBaseEnabled: true,
      databaseIntelligenceEnabled: true,
      automationStudioEnabled: true,
      apiAccessEnabled: true,
      mcpEnabled: true,
      byokEnabled: true, // Requested by user starting at Pro
      prioritySupportEnabled: true,
    },
    {
      name: "Agency",
      slug: "agency",
      description: "For agencies building for multiple clients",
      monthlyPrice: 24900,
      yearlyPrice: 249000,
      isActive: true,
      knowledgeBaseLimit: 50,
      databaseLimit: 50,
      workspaceLimit: 50,
      automationLimit: 100,
      apiRequestLimit: 500000,
      contextLimit: 100000000, // 100MB
      mcpServerLimit: 25,
      mcpToolLimit: 100,
      mcpRequestLimit: 250000,
      knowledgeBaseEnabled: true,
      databaseIntelligenceEnabled: true,
      automationStudioEnabled: true,
      apiAccessEnabled: true,
      mcpEnabled: true,
      byokEnabled: true,
      prioritySupportEnabled: true,
    },
    {
      name: "Enterprise",
      slug: "enterprise",
      description: "Custom deployment, SLA, dedicated support, custom MCP infrastructure",
      monthlyPrice: 0, // Enterprise relies on Contact Sales
      yearlyPrice: 0,
      isActive: true,
      knowledgeBaseLimit: 9999,
      databaseLimit: 9999,
      workspaceLimit: 9999,
      automationLimit: 9999,
      apiRequestLimit: 99999999,
      contextLimit: 1000000000, // 1GB
      mcpServerLimit: 9999,
      mcpToolLimit: 9999,
      mcpRequestLimit: 99999999,
      knowledgeBaseEnabled: true,
      databaseIntelligenceEnabled: true,
      automationStudioEnabled: true,
      apiAccessEnabled: true,
      mcpEnabled: true,
      byokEnabled: true,
      prioritySupportEnabled: true,
    }
  ];

  for (const plan of plans) {
    const existing = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.slug, plan.slug));
    if (existing.length > 0) {
      await db.update(subscriptionPlans).set(plan).where(eq(subscriptionPlans.slug, plan.slug));
    } else {
      await db.insert(subscriptionPlans).values(plan);
    }
  }

  console.log("Seeding Promotions...");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 day Early Access promo

  const promo = {
    code: "FOUNDING_USER",
    description: "Early Access / Founding User Pricing",
    type: "discount",
    value: { discountPercent: 30 },
    duration: null, // lifetime discount on the subscription
    isActive: true,
    expiresAt,
  };

  const existingPromo = await db.select().from(promotionTemplates).where(eq(promotionTemplates.code, promo.code));
  if (existingPromo.length > 0) {
    await db.update(promotionTemplates).set(promo).where(eq(promotionTemplates.code, promo.code));
  } else {
    await db.insert(promotionTemplates).values(promo);
  }

  console.log("Database Seeded Successfully.");
  process.exit(0);
}

main().catch(console.error);
