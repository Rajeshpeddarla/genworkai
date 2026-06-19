import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: './apps/web/.env.local' });

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const db = drizzle(pool);

async function run() {
  try {
    const migrationSql = fs.readFileSync(path.join(process.cwd(), 'apps/web/drizzle/0005_high_squadron_supreme.sql'), 'utf8');
    
    // Split by statement-breakpoint and execute
    const statements = migrationSql.split('--> statement-breakpoint');
    
    for (const stmt of statements) {
      if (stmt.trim()) {
        console.log('Executing:', stmt.trim());
        try {
            await pool.query(stmt.trim());
        } catch (e: any) {
            if (e.code === '42P07') {
                console.log('Relation already exists, skipping...');
            } else if (e.code === '42701') {
                console.log('Column already exists, skipping...');
            } else if (e.code === '42710') {
                console.log('Constraint already exists, skipping...');
            } else {
                throw e;
            }
        }
      }
    }
    
    console.log("Migration successful");
  } catch (e) {
    console.error("Migration failed:", e);
  } finally {
    await pool.end();
  }
}

run();
