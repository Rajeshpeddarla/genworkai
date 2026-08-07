const { Client } = require('pg');
require('dotenv').config({ path: './.env.local' });

async function query() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const res = await client.query("SELECT request_metadata FROM request_logs WHERE status = 'error' ORDER BY id DESC LIMIT 3;");
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}
query().catch(console.error);
