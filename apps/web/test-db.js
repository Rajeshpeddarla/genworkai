import pkg from 'pg';
const { Client } = pkg;
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    await client.connect();
    console.log("Connected to Supabase!");
    
    await client.query('CREATE EXTENSION IF NOT EXISTS vector;');
    console.log("pgvector extension enabled successfully.");
    
    process.exit(0);
  } catch (err) {
    console.error("Failed to connect or create extension:", err);
    process.exit(1);
  }
}

main();
