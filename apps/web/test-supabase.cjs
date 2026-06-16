const { Client } = require('pg');

async function testConnection() {
  const client = new Client({
    host: 'aws-1-ap-south-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    user: 'postgres.ctyzlvywuginxxrrgdsj',
    password: 'DTQfM!Mp1v5^ZBsG53Rd',
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to Supabase...');
    await client.connect();
    console.log('Connected successfully!');
    const res = await client.query('SELECT NOW() as current_time;');
    console.log('Time from DB:', res.rows[0].current_time);
    
    // Check tables
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Tables found:', tables.rows.map(r => r.table_name).join(', '));
    
  } catch (err) {
    console.error('Connection error:', err);
  } finally {
    await client.end();
    console.log('Connection closed.');
  }
}

testConnection();
