import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';
dotenv.config({ path: './apps/web/.env.local' });

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const db = drizzle(pool);

async function run() {
  try {
    await db.execute(sql`ALTER TABLE connected_databases ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id) ON DELETE CASCADE;`);
    await db.execute(sql`ALTER TABLE knowledge_sources ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id) ON DELETE CASCADE;`);
    console.log("Migration successful");
  } catch (e) {
    console.error("Migration failed:", e);
  } finally {
    await pool.end();
  }
}

run();
