import { db } from '../db';
import { subscriptionPlans } from '../db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  console.log('Upserting Starter Tier...');

  const starterPlan = {
    name: 'Starter',
    slug: 'starter',
    description: 'Perfect for individual developers and small teams building 1-2 apps.',
    monthlyPrice: 900, // $9.00
    yearlyPrice: 9000, // $90.00
    isActive: true,
    
    // Limits
    knowledgeBaseLimit: 2,
    databaseLimit: 2,
    workspaceLimit: 2,
    automationLimit: 5,
    apiKeyLimit: 2,
    apiRequestLimit: 10000,
    contextLimit: 50 * 1024 * 1024, // 50MB
    mcpServerLimit: 1,
    mcpToolLimit: 5,
    mcpRequestLimit: 500,

    // Features
    knowledgeBaseEnabled: true,
    databaseIntelligenceEnabled: true,
    automationStudioEnabled: true,
    apiAccessEnabled: true,
    mcpEnabled: true,
    byokEnabled: false,
    prioritySupportEnabled: false,
  };

  const existing = await db.query.subscriptionPlans.findFirst({
    where: eq(subscriptionPlans.slug, 'starter')
  });

  if (existing) {
    await db.update(subscriptionPlans)
      .set(starterPlan)
      .where(eq(subscriptionPlans.slug, 'starter'));
    console.log('Updated existing Starter plan.');
  } else {
    await db.insert(subscriptionPlans).values(starterPlan);
    console.log('Inserted new Starter plan.');
  }

  console.log('Done!');
  process.exit(0);
}

main().catch(console.error);
