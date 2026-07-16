import { db } from './db/index';
import { baseparsePricingPlans } from './db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  const plans = [
    { name: 'Free', priceCents: 0, pageExtractionLimit: 100, displayOrder: 1 },
    { name: 'Starter', priceCents: 990, pageExtractionLimit: 5000, displayOrder: 2 },
    { name: 'Pro', priceCents: 2500, pageExtractionLimit: 15000, displayOrder: 3 },
    { name: 'Enterprise', priceCents: 4900, pageExtractionLimit: 100000, displayOrder: 4 },
  ];

  for (const plan of plans) {
    const existing = await db.select().from(baseparsePricingPlans).where(eq(baseparsePricingPlans.name, plan.name));
    if (existing.length === 0) {
      await db.insert(baseparsePricingPlans).values(plan);
      console.log(`Inserted plan ${plan.name}`);
    } else {
      console.log(`Plan ${plan.name} already exists`);
    }
  }
  process.exit(0);
}

main().catch(console.error);
