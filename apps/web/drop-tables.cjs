const { Client } = require('pg');

async function dropTables() {
  const client = new Client({
    connectionString: 'postgresql://postgres.ctyzlvywuginxxrrgdsj:DTQfM%21Mp1v5%5EZBsG53Rd@aws-1-ap-south-1.pooler.supabase.com:6543/postgres'
  });

  try {
    await client.connect();
    console.log('Connected.');

    // Drop tables if they exist to allow clean migration
    await client.query(`
      DROP TABLE IF EXISTS automation_logs CASCADE;
      DROP TABLE IF EXISTS automation_tasks CASCADE;
      DROP TABLE IF EXISTS database_schemas CASCADE;
      DROP TABLE IF EXISTS connected_databases CASCADE;
      DROP TABLE IF EXISTS promotions CASCADE;
      DROP TABLE IF EXISTS system_config CASCADE;
    `);
    console.log('Tables dropped.');
    
    // We also need to drop columns from profiles if they exist, to let migration add them.
    try {
      await client.query(`
        ALTER TABLE profiles 
        DROP COLUMN IF EXISTS is_admin,
        DROP COLUMN IF EXISTS is_active,
        DROP COLUMN IF EXISTS user_role,
        DROP COLUMN IF EXISTS social_url,
        DROP COLUMN IF EXISTS country;
      `);
      console.log('Profile columns dropped.');
    } catch(e) {
      console.log('Error dropping profile columns:', e.message);
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

dropTables();
