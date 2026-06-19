import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config({ path: 'apps/web/.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_llm_keys (
      id SERIAL PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      provider VARCHAR(50) NOT NULL,
      api_key TEXT NOT NULL,
      base_url TEXT,
      default_model VARCHAR(100),
      scope VARCHAR(50) DEFAULT 'personal',
      status VARCHAR(50) DEFAULT 'active',
      last_validated_at TIMESTAMP,
      last_error TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS ai_profiles (
      id SERIAL PRIMARY KEY,
      user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
      workspace_model_id INTEGER REFERENCES user_llm_keys(id) ON DELETE SET NULL,
      knowledge_model_id INTEGER REFERENCES user_llm_keys(id) ON DELETE SET NULL,
      database_model_id INTEGER REFERENCES user_llm_keys(id) ON DELETE SET NULL,
      automation_model_id INTEGER REFERENCES user_llm_keys(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log('Phase 3 tables created successfully');
  process.exit(0);
}
run();
