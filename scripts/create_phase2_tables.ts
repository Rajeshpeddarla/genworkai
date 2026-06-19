import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config({ path: 'apps/web/.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS api_usage_counters (
      id SERIAL PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      period VARCHAR(7) NOT NULL,
      requests INTEGER DEFAULT 0 NOT NULL,
      llm_tokens INTEGER DEFAULT 0 NOT NULL,
      db_queries INTEGER DEFAULT 0 NOT NULL,
      vector_searches INTEGER DEFAULT 0 NOT NULL,
      generated_artifacts INTEGER DEFAULT 0 NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS api_usage_counters_user_period_idx ON api_usage_counters (user_id, period);

    CREATE TABLE IF NOT EXISTS database_query_logs (
      id SERIAL PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      database_id INTEGER NOT NULL REFERENCES connected_databases(id) ON DELETE CASCADE,
      question TEXT,
      generated_sql TEXT,
      execution_time_ms INTEGER,
      row_count INTEGER,
      success BOOLEAN DEFAULT true,
      error TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log('Phase 2 tables created successfully');
  process.exit(0);
}
run();
