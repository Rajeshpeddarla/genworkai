fetch('http://localhost:3000/api/knowledge/sources/database', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    engine: 'pg',
    connectionString: 'postgresql://postgres.ctyzlvywuginxxrrgdsj:DTQfM%21Mp1v5%5EZBsG53Rd@aws-1-ap-south-1.pooler.supabase.com:6543/postgres'
  })
}).then(async r => {
  console.log(r.status);
  console.log(await r.text());
}).catch(console.error);
