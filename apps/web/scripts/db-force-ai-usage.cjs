const { config } = require('dotenv');
config({ path: '.env.local' });
const { Client } = require('pg');

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  
  await client.query(`
    CREATE TABLE IF NOT EXISTS ai_usage (
      id SERIAL PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES profiles(id),
      workspace_id INTEGER,
      operation VARCHAR(100) NOT NULL,
      feature_category VARCHAR(100),
      endpoint VARCHAR(255),
      artifact_type VARCHAR(100),
      billing_mode VARCHAR(50) NOT NULL DEFAULT 'platform',
      is_byok BOOLEAN DEFAULT false,
      request_id VARCHAR(255),
      correlation_id VARCHAR(255),
      provider VARCHAR(50),
      model VARCHAR(100),
      input_tokens INTEGER DEFAULT 0,
      output_tokens INTEGER DEFAULT 0,
      embedding_tokens INTEGER DEFAULT 0,
      reranker_tokens INTEGER DEFAULT 0,
      estimated_credits INTEGER DEFAULT 0,
      reserved_credits INTEGER DEFAULT 0,
      actual_credits INTEGER DEFAULT 0,
      provider_cost NUMERIC(10, 6),
      status VARCHAR(50) DEFAULT 'completed',
      reservation_status VARCHAR(50),
      failure_reason TEXT,
      duration_ms INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('ai_usage table created');
  process.exit(0);
}
main().catch(console.error);
