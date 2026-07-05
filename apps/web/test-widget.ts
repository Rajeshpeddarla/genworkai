import { db } from './db';
import { dashboardWidgets } from './db/schema';
import { desc } from 'drizzle-orm';

async function run() {
  const w = await db.select().from(dashboardWidgets).orderBy(desc(dashboardWidgets.createdAt)).limit(1);
  console.log(w[0]);
  process.exit(0);
}
run();
