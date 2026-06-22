import { config } from 'dotenv';
config({ path: '.env.local' });
import { db } from './db/index';
import { subscriptionPlans } from './db/schema';

async function main() {
  await db.delete(subscriptionPlans);
  console.log("Deleted all subscription plans");
  process.exit(0);
}

main().catch(console.error);
