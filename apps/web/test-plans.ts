import { db } from './db';
import { subscriptionPlans } from './db/schema';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  const plans = await db.query.subscriptionPlans.findMany();
  console.log(JSON.stringify(plans, null, 2));
}
main().catch(console.error);
