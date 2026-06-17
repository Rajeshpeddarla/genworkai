const { drizzle } = require('drizzle-orm/node-postgres');
const { migrate } = require('drizzle-orm/node-postgres/migrator');
const { Client } = require('pg');

async function doMigrate() {
  const client = new Client({
    connectionString: 'postgresql://postgres.ctyzlvywuginxxrrgdsj:DTQfM%21Mp1v5%5EZBsG53Rd@aws-1-ap-south-1.pooler.supabase.com:6543/postgres'
  });

  try {
    await client.connect();
    const db = drizzle(client);
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('Migration successful');
  } catch (err) {
    console.error('Migration failed with error:', err);
  } finally {
    await client.end();
  }
}

doMigrate();
