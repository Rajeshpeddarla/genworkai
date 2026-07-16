import { db } from './db/index';
import { sql } from 'drizzle-orm';

async function main() {
  await db.execute(sql`NOTIFY pgrst, 'reload schema'`);
  console.log("Reloaded");
  process.exit(0);
}

main().catch(console.error);
