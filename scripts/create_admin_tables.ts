import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config({ path: 'apps/web/.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  await pool.query(`
    DROP TABLE IF EXISTS subscription_plans CASCADE;
    CREATE TABLE subscription_plans (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      slug VARCHAR(100) NOT NULL UNIQUE,
      description TEXT,
      monthly_price INTEGER DEFAULT 0,
      yearly_price INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      knowledge_base_limit INTEGER DEFAULT 0,
      database_limit INTEGER DEFAULT 0,
      workspace_limit INTEGER DEFAULT 0,
      automation_limit INTEGER DEFAULT 0,
      api_request_limit INTEGER DEFAULT 0,
      context_limit BIGINT DEFAULT 0,
      knowledge_base_enabled BOOLEAN DEFAULT false,
      database_intelligence_enabled BOOLEAN DEFAULT false,
      automation_studio_enabled BOOLEAN DEFAULT false,
      api_access_enabled BOOLEAN DEFAULT false,
      mcp_enabled BOOLEAN DEFAULT false,
      byok_enabled BOOLEAN DEFAULT false,
      priority_support_enabled BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS promotion_templates (
      id SERIAL PRIMARY KEY,
      code VARCHAR(50) NOT NULL UNIQUE,
      description TEXT,
      type VARCHAR(50) NOT NULL,
      value JSONB,
      duration INTEGER,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS admin_audit_logs (
      id SERIAL PRIMARY KEY,
      admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
      action VARCHAR(255) NOT NULL,
      entity_type VARCHAR(100),
      entity_id VARCHAR(255),
      previous_value JSONB,
      new_value JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS feature_flags (
      id SERIAL PRIMARY KEY,
      key VARCHAR(100) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      is_enabled BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS ticket_messages (
      id SERIAL PRIMARY KEY,
      ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
      sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
      is_agent BOOLEAN DEFAULT false NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );

    -- Seed subscription plans
    INSERT INTO subscription_plans (name, slug, description, monthly_price, yearly_price, is_active, knowledge_base_limit, database_limit, workspace_limit, automation_limit, api_request_limit, context_limit, knowledge_base_enabled, database_intelligence_enabled, automation_studio_enabled, api_access_enabled, mcp_enabled, byok_enabled, priority_support_enabled)
    VALUES
    ('Free', 'free', 'Basic features to get started.', 0, 0, true, 1, 1, 1, 0, 0, 1048576, true, false, false, false, false, false, false),
    ('Starter', 'starter', 'Great for individuals.', 1500, 15000, true, 5, 3, 5, 5, 1000, 10485760, true, true, false, false, false, false, false),
    ('Pro', 'pro', 'For professionals needing more power.', 4900, 49000, true, 20, 10, 20, 50, 10000, 52428800, true, true, true, true, false, false, true),
    ('Agency', 'agency', 'For agencies and teams.', 19900, 199000, true, 100, 50, 100, 500, 100000, 524288000, true, true, true, true, true, false, true),
    ('Enterprise', 'enterprise', 'Unlimited everything.', 99900, 999000, true, 1000, 1000, 1000, 5000, 1000000, 5242880000, true, true, true, true, true, true, true)
    ON CONFLICT (slug) DO NOTHING;

    -- Seed feature flags
    INSERT INTO feature_flags (key, name, description, is_enabled)
    VALUES
    ('knowledge_base', 'Knowledge Base', 'Allow creation and management of Knowledge Bases', true),
    ('database_intelligence', 'Database Intelligence', 'Allow database connections and querying', true),
    ('automation_studio', 'Automation Studio', 'Enable automated workflows', true),
    ('mcp_builder', 'MCP Builder', 'Enable Model Context Protocol server creation', true),
    ('byok', 'Bring Your Own Key', 'Allow users to provide their own LLM API keys', true),
    ('public_api', 'Public API Access', 'Enable API key generation and external access', true)
    ON CONFLICT (key) DO NOTHING;
  `);
  console.log('Admin tables and seed data created successfully');
  process.exit(0);
}
run().catch(err => {
  console.error(err);
  process.exit(1);
});
