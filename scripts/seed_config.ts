import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { systemConfig } from '../apps/web/db/schema';
import { eq } from 'drizzle-orm';

dotenv.config({ path: './apps/web/.env.local' });

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const db = drizzle(pool);

async function run() {
  try {
    const configData = {
      support_email: 'varunsai428@gmail.com',
      sales_email: 'varunsai428@gmail.com',
      phone_number: '+91 8790201697',
      linkedin_url: 'https://linkedin.com/company/genworkai',
      twitter_url: 'https://twitter.com/genworkai'
    };

    await db.insert(systemConfig)
      .values({
        key: 'global_contact_info',
        value: configData
      })
      .onConflictDoUpdate({
        target: systemConfig.key,
        set: { value: configData }
      });
      
    console.log("Seeded system_config successfully");
  } catch (e) {
    console.error("Seeding failed:", e);
  } finally {
    await pool.end();
  }
}

run();
