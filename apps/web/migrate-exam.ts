import 'dotenv/config';
import { sql } from 'drizzle-orm';
import { db } from './db/index.js';

async function main() {
  console.log('Running manual schema migrations for Quizzes...');
  
  try {
    // quizzes table updates
    await db.execute(sql`ALTER TABLE quizzes ADD COLUMN shareable_link VARCHAR(255) UNIQUE;`);
    await db.execute(sql`ALTER TABLE quizzes ADD COLUMN timing_mode VARCHAR(50) DEFAULT 'self_paced';`);
    await db.execute(sql`ALTER TABLE quizzes ADD COLUMN start_time TIMESTAMP;`);
    await db.execute(sql`ALTER TABLE quizzes ADD COLUMN end_time TIMESTAMP;`);
    console.log('Added new columns to quizzes table');
  } catch (e: any) {
    console.log('quizzes columns might already exist:', e.message);
  }

  try {
    // quiz_attempts table updates
    await db.execute(sql`ALTER TABLE quiz_attempts ALTER COLUMN user_id DROP NOT NULL;`);
    await db.execute(sql`ALTER TABLE quiz_attempts ADD COLUMN guest_name VARCHAR(255);`);
    await db.execute(sql`ALTER TABLE quiz_attempts ADD COLUMN guest_roll_number VARCHAR(255);`);
    console.log('Updated quiz_attempts table for guest access');
  } catch (e: any) {
    console.log('quiz_attempts columns might already exist:', e.message);
  }

  console.log('Done!');
  process.exit(0);
}

main();
