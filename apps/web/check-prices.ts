import { config } from 'dotenv';
config({ path: '.env.local' });

async function main() {
  const { db } = await import('./db/index.js');
  const { subscriptionPlans } = await import('./db/schema.js');
  const plans = await db.select().from(subscriptionPlans);
  for (const p of plans) {
    console.log(`Plan: ${p.name}, Monthly: ${p.paddleMonthlyPriceId}, Yearly: ${p.paddleYearlyPriceId}`);
  }
  process.exit(0);
}

main().catch(console.error);
