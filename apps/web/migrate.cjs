require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_credit_ledger (
        id serial PRIMARY KEY,
        user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        amount integer NOT NULL,
        type varchar(50) NOT NULL,
        operation_key varchar(100),
        idempotency_key varchar(255) UNIQUE,
        description text,
        created_at timestamp DEFAULT now()
      );
    `);
    console.log('Done');
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

migrate();
