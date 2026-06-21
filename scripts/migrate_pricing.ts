import { db } from "../apps/web/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Migrating database...");

  try {
    await db.execute(sql`ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS mcp_server_limit INTEGER DEFAULT 0;`);
    await db.execute(sql`ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS mcp_tool_limit INTEGER DEFAULT 0;`);
    await db.execute(sql`ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS mcp_request_limit INTEGER DEFAULT 0;`);
    await db.execute(sql`ALTER TABLE promotion_templates ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;`);
    console.log("Migration successful.");
  } catch (error) {
    console.error("Migration failed:", error);
  }

  process.exit(0);
}

main().catch(console.error);
