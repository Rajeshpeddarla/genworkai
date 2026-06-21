import { db } from "../apps/web/db";
import { sql } from "drizzle-orm";

async function main() {
  await db.execute(sql`TRUNCATE TABLE subscription_plans CASCADE;`);
  await db.execute(sql`TRUNCATE TABLE promotion_templates CASCADE;`);
  console.log('Truncated');
  process.exit(0);
}
main().catch(console.error);
