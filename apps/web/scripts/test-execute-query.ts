import { DatabaseService } from '../lib/database/DatabaseService';

async function run() {
  try {
    const config = {
      engine: 'pg', // Or mysql/mssql depending on what you test
      connectionString: 'postgres://invalid:password@localhost:5432/db'
    };
    
    const service = new DatabaseService(config as any);
    console.log("Testing executeQuery with simple SELECT 1...");
    
    // We expect it to fail connecting, but we want to see if validation passes!
    await service.executeQuery('SELECT 1');
    console.log("Done");
  } catch (err: any) {
    console.log("Error:", err.message);
  }
}

run();
