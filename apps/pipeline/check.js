const { Client } = require('pg');
const connectionString = 'postgresql://postgres.ctyzlvywuginxxrrgdsj:DTQfM%21Mp1v5%5EZBsG53Rd@aws-1-ap-south-1.pooler.supabase.com:6543/postgres';
const c = new Client({ connectionString });
(async () => {
  await c.connect();
  const res = await c.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
  console.log(res.rows.map(r => r.table_name));
  await c.end();
})();
