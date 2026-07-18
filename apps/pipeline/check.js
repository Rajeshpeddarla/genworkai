const { Client } = require('pg');
const connectionString = 'postgresql://postgres.ctyzlvywuginxxrrgdsj:DTQfM%21Mp1v5%5EZBsG53Rd@aws-1-ap-south-1.pooler.supabase.com:6543/postgres';
const c = new Client({ connectionString });
(async () => {
  await c.connect();
  await c.query('ALTER TABLE baseparse_documents ADD COLUMN IF NOT EXISTS checksum VARCHAR(64)');
  const res = await c.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'baseparse_documents'");
  console.log(res.rows);
  await c.end();
})();
