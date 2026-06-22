import { config } from 'dotenv';
config({ path: '.env.local' });
import fs from 'fs';
import { db } from './db/index';
import { sql } from 'drizzle-orm';

async function main() {
  const fileContent = fs.readFileSync('drizzle/0009_safe_slyde.sql', 'utf8');
  const statements = fileContent.split('--> statement-breakpoint');
  
  for (const statement of statements) {
    const trimmed = statement.trim();
    if (!trimmed) continue;
    try {
      await db.execute(sql.raw(trimmed));
      console.log(`Executed: ${statement.slice(0, 50)}...`);
    } catch (e: any) {
      console.error(`Error executing statement: ${statement.slice(0, 50)}...`);
      console.error(e.message || e);
    }
  }
  console.log("Migration complete.");
  process.exit(0);
}

main().catch(console.error);
