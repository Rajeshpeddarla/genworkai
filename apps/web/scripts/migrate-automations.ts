import 'dotenv/config';
import { db } from '../db';
import { sql } from 'drizzle-orm';

async function migrate() {
  console.log('Running migration...');
  
  try {
    await db.execute(sql`
      ALTER TABLE automation_tasks 
      ADD COLUMN IF NOT EXISTS sql_query text,
      ADD COLUMN IF NOT EXISTS success_rate integer DEFAULT 100,
      ADD COLUMN IF NOT EXISTS average_runtime_ms integer DEFAULT 0,
      ADD COLUMN IF NOT EXISTS credits_consumed_this_month integer DEFAULT 0,
      ADD COLUMN IF NOT EXISTS total_runs integer DEFAULT 0,
      ADD COLUMN IF NOT EXISTS last_failure_at timestamp,
      ADD COLUMN IF NOT EXISTS ai_provider varchar(50),
      ADD COLUMN IF NOT EXISTS billing_mode varchar(50) DEFAULT 'platform';
    `);
    console.log('Altered automation_tasks');

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS automation_versions (
        id SERIAL PRIMARY KEY,
        task_id INTEGER REFERENCES automation_tasks(id) ON DELETE CASCADE,
        version_number INTEGER NOT NULL,
        config_snapshot JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
      );
    `);
    console.log('Created automation_versions');

    await db.execute(sql`
      ALTER TABLE automation_logs
      ADD COLUMN IF NOT EXISTS duration_ms integer,
      ADD COLUMN IF NOT EXISTS credits_consumed integer DEFAULT 0,
      ADD COLUMN IF NOT EXISTS provider varchar(50),
      ADD COLUMN IF NOT EXISTS model varchar(100),
      ADD COLUMN IF NOT EXISTS input_tokens integer DEFAULT 0,
      ADD COLUMN IF NOT EXISTS output_tokens integer DEFAULT 0,
      ADD COLUMN IF NOT EXISTS sql_executed text,
      ADD COLUMN IF NOT EXISTS notifications_sent integer DEFAULT 0,
      ADD COLUMN IF NOT EXISTS error_details text,
      ADD COLUMN IF NOT EXISTS retry_count integer DEFAULT 0;
    `);
    console.log('Altered automation_logs');

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
  
  process.exit(0);
}

migrate();
