const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function check() {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  const res1 = await c.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'baseparse_pricing_plans'");
  console.log('pricing_plans:', res1.rows);
  const res2 = await c.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'baseparse_user_plans'");
  console.log('user_plans:', res2.rows);
  const res3 = await c.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles'");
  console.log('profiles:', res3.rows);
  await c.end();
}
check().catch(console.error);
