import { config } from 'dotenv';
config({ path: '.env.local' });
import { db } from '../db/index';
import { sql } from 'drizzle-orm';

async function main() {
  await db.execute(sql`TRUNCATE TABLE subscription_plans CASCADE`);
  console.log('Truncated');
  process.exit(0);
}
main().catch(console.error);
