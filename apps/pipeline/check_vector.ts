import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  await client.connect();
  
  try {
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'baseparse_embeddings';
    `);
    console.log("Embeddings table exists:", res.rows.length > 0);

    const extRes = await client.query(`
      SELECT extname FROM pg_extension WHERE extname = 'vector';
    `);
    console.log("Vector extension exists:", extRes.rows.length > 0);
  } catch (e) {
    console.error("Error:", e);
  }

  await client.end();
}

main();
