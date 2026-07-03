const { Client } = require('pg');

async function test() {
  const connectionString = 'postgres://postgres:supabase@db.xyz.supabase.co:5432/postgres?sslmode=require'; // Dummy URL just to see what error pg throws
  
  const client = new Client({
    connectionString,
  });
  
  try {
    await client.connect();
    console.log('Connected');
  } catch (e) {
    console.log('Error:', e.message);
  } finally {
    await client.end();
  }
}

test();
