import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { db } from '../db';
import { sql } from 'drizzle-orm';

async function clearDatabase() {
  console.log('Clearing database...');
  try {
    // Disable foreign key checks for the transaction
    // Then truncate all tables
    // In postgres, TRUNCATE with CASCADE deletes everything
    const result = await db.execute(sql`
      DO $$ DECLARE
          r RECORD;
      BEGIN
          FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
              EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' CASCADE';
          END LOOP;
      END $$;
    `);
    
    console.log('Database cleared successfully!');
  } catch (error) {
    console.error('Error clearing database:', error);
  } finally {
    process.exit(0);
  }
}

clearDatabase();
