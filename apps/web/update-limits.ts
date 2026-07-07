import { db } from './db';
import { subscriptionPlans } from './db/schema';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  console.log('Updating Starter Plan...');
  await db.update(subscriptionPlans)
    .set({
      monthlyAiCredits: 2000,
      apiRequestLimit: 500,
      mcpRequestLimit: 500
    })
    .where(eq(subscriptionPlans.slug, 'starter'));

  console.log('Updating Pro Plan...');
  await db.update(subscriptionPlans)
    .set({
      mcpRequestLimit: 5000
    })
    .where(eq(subscriptionPlans.slug, 'pro'));

  console.log('Update complete!');
}

main().catch(console.error);
