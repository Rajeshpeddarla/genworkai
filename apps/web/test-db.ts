import { db } from './db/index';
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function main() {
  try {
    console.log("Testing connection...");
    // Attempt a simple query
    const res = await db.execute(sql`SELECT NOW()`);
    console.log("Connection successful:", res.rows[0]);
    
    console.log("Enabling pgvector extension...");
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS vector;`);
    console.log("Extension enabled.");
    process.exit(0);
  } catch (e) {
    console.error("Database connection failed:", e);
    process.exit(1);
  }
}

main();
