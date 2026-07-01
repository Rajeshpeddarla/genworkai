import { config } from 'dotenv';
config({ path: '.env.local' });
import { db } from '../db/index.js';
import { subscriptionPlans } from '../db/schema.js';
import { eq } from 'drizzle-orm';

async function main() {
  console.log('Upserting Base Plans with New MCP & Automation Limits...');

  const plans = [
    {
      name: 'Free',
      slug: 'free',
      mcpServerLimit: 2,
      automationLimit: 5,
      knowledgeBaseLimit: 2,
      databaseLimit: 1,
      workspaceLimit: 1,
      contextLimit: 104857600,
      monthlyAiCredits: 50,
      knowledgeBaseEnabled: true,
      databaseIntelligenceEnabled: true,
      automationStudioEnabled: true,
      mcpEnabled: true
    },
    {
      name: 'Starter',
      slug: 'starter',
      mcpServerLimit: 3,
      automationLimit: 10,
      knowledgeBaseLimit: 3,
      databaseLimit: 3,
      workspaceLimit: 3,
      contextLimit: 500000000,
      monthlyAiCredits: 500,
      knowledgeBaseEnabled: true,
      databaseIntelligenceEnabled: true,
      automationStudioEnabled: true,
      mcpEnabled: true
    },
    {
      name: 'Pro',
      slug: 'pro',
      mcpServerLimit: 20,
      automationLimit: 30,
      knowledgeBaseLimit: 20,
      databaseLimit: 20,
      workspaceLimit: 20,
      contextLimit: 5000000000,
      monthlyAiCredits: 5000,
      knowledgeBaseEnabled: true,
      databaseIntelligenceEnabled: true,
      automationStudioEnabled: true,
      mcpEnabled: true
    }
  ];

  for (const plan of plans) {
    const existing = await db.query.subscriptionPlans.findFirst({
      where: eq(subscriptionPlans.slug, plan.slug)
    });

    if (existing) {
      await db.update(subscriptionPlans).set({
        mcpServerLimit: plan.mcpServerLimit,
        automationLimit: plan.automationLimit,
        knowledgeBaseLimit: plan.knowledgeBaseLimit,
        databaseLimit: plan.databaseLimit,
        workspaceLimit: plan.workspaceLimit,
        contextLimit: plan.contextLimit,
        monthlyAiCredits: plan.monthlyAiCredits,
        knowledgeBaseEnabled: plan.knowledgeBaseEnabled,
        databaseIntelligenceEnabled: plan.databaseIntelligenceEnabled,
        automationStudioEnabled: plan.automationStudioEnabled,
        mcpEnabled: plan.mcpEnabled
      }).where(eq(subscriptionPlans.slug, plan.slug));
      console.log(`Updated ${plan.name} - MCP: ${plan.mcpServerLimit}, Automation: ${plan.automationLimit}, Monthly AI Credits: ${plan.monthlyAiCredits}`);
    } else {
      console.log(`Plan ${plan.slug} not found!`);
    }
  }

  console.log('Done!');
  process.exit(0);
}

main().catch(console.error);
