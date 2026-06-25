import { db } from '../db/index';
import { sql } from 'drizzle-orm';

async function main() {
  try {
    console.log("Adding api_key_limit column to subscription_plans...");
    await db.execute(sql`ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS api_key_limit integer DEFAULT 0;`);
    console.log("Column added successfully!");
  } catch (error) {
    console.error("Error adding column:", error);
  }
  process.exit(0);
}

main();
