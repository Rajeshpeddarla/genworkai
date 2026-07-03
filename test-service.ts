const { DatabaseService } = require('./apps/web/lib/database/DatabaseService.ts');

async function run() {
  const config = {
    engine: 'pg',
    connectionString: 'postgresql://postgres.ctyzlvywuginxxrrgdsj:DTQfM%21Mp1v5%5EZBsG53Rd@aws-1-ap-south-1.pooler.supabase.com:6543/postgres'
  };
  const service = new DatabaseService(config);
  try {
    const isConnected = await service.testConnection();
    console.log('Connected:', isConnected);
    
    if (isConnected) {
       console.log('Extracting schema...');
       const schema = await service.extractSchema();
       console.log('Schema:', Object.keys(schema).length, 'tables');
    }
  } catch (e) {
    console.error('Service error:', e);
  }
}
run();
