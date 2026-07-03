const { Client } = require('pg');

async function test() {
  const connectionString = 'postgresql://postgres.ctyzlvywuginxxrrgdsj:DTQfM%21Mp1v5%5EZBsG53Rd@aws-1-ap-south-1.pooler.supabase.com:6543/postgres';
  
  const client1 = new Client({
    connectionString,
  });
  
  try {
    await client1.connect();
    console.log('Client 1 (no SSL explicitly set): Connected');
  } catch (e) {
    console.log('Client 1 Error:', e.message);
  } finally {
    await client1.end();
  }

  const client2 = new Client({
    connectionString,
    ssl: true // Just enforcing SSL with verify-full basically
  });
  
  try {
    await client2.connect();
    console.log('Client 2 (ssl: true): Connected');
  } catch (e) {
    console.log('Client 2 Error:', e.message);
  } finally {
    await client2.end();
  }
}

test();
