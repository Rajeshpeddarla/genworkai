import { config } from 'dotenv';
config({ path: '.env.local' });

async function seed() {
  const { db } = await import('./db/index.js');
  const { subscriptionPlans } = await import('./db/schema.js');

  const plansToInsert = [
    {
      name: 'Free',
      slug: 'free',
      description: 'For individuals exploring the platform.',
      monthlyPrice: 0,
      yearlyPrice: 0,
      isActive: true,
      knowledgeBaseLimit: 1,
      databaseLimit: 0,
      workspaceLimit: 1,
      automationLimit: 0,
      apiRequestLimit: 1000,
      contextLimit: 10000000,
      mcpServerLimit: 1,
      mcpToolLimit: 5,
      mcpRequestLimit: 500,
      knowledgeBaseEnabled: true,
      databaseIntelligenceEnabled: false,
      automationStudioEnabled: false,
      apiAccessEnabled: false,
      mcpEnabled: true,
      byokEnabled: false,
      prioritySupportEnabled: false,
    },
    {
      name: 'Pro',
      slug: 'pro',
      description: 'For independent researchers and developers.',
      monthlyPrice: 1900,
      yearlyPrice: 19000,
      isActive: true,
      knowledgeBaseLimit: 10,
      databaseLimit: 3,
      workspaceLimit: 1,
      automationLimit: 10,
      apiRequestLimit: 50000,
      contextLimit: 100000000,
      mcpServerLimit: 5,
      mcpToolLimit: 20,
      mcpRequestLimit: 10000,
      knowledgeBaseEnabled: true,
      databaseIntelligenceEnabled: true,
      automationStudioEnabled: true,
      apiAccessEnabled: true,
      mcpEnabled: true,
      byokEnabled: false,
      prioritySupportEnabled: true,
    },
    {
      name: 'Team',
      slug: 'team',
      description: 'For growing teams requiring collaboration.',
      monthlyPrice: 3900,
      yearlyPrice: 39000,
      isActive: true,
      knowledgeBaseLimit: 50,
      databaseLimit: 10,
      workspaceLimit: 5,
      automationLimit: 50,
      apiRequestLimit: 250000,
      contextLimit: 500000000,
      mcpServerLimit: 20,
      mcpToolLimit: 100,
      mcpRequestLimit: 100000,
      knowledgeBaseEnabled: true,
      databaseIntelligenceEnabled: true,
      automationStudioEnabled: true,
      apiAccessEnabled: true,
      mcpEnabled: true,
      byokEnabled: true,
      prioritySupportEnabled: true,
    },
    {
      name: 'Enterprise',
      slug: 'enterprise',
      description: 'For large enterprises with specific security needs.',
      monthlyPrice: 9900,
      yearlyPrice: 99000,
      isActive: true,
      knowledgeBaseLimit: -1,
      databaseLimit: -1,
      workspaceLimit: -1,
      automationLimit: -1,
      apiRequestLimit: -1,
      contextLimit: -1,
      mcpServerLimit: -1,
      mcpToolLimit: -1,
      mcpRequestLimit: -1,
      knowledgeBaseEnabled: true,
      databaseIntelligenceEnabled: true,
      automationStudioEnabled: true,
      apiAccessEnabled: true,
      mcpEnabled: true,
      byokEnabled: true,
      prioritySupportEnabled: true,
    }
  ];

  for (const plan of plansToInsert) {
    await db.insert(subscriptionPlans).values(plan).onConflictDoNothing();
  }

  console.log('Seed completed successfully!');
  process.exit(0);
}

seed().catch(console.error);
