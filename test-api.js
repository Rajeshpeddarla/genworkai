fetch('http://localhost:3000/api/knowledge/sources/database', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    engine: 'pg',
    connectionString: 'postgres://postgres:supabase@db.xyz.supabase.co:5432/postgres'
  })
}).then(async r => {
  console.log(r.status);
  console.log(await r.text());
}).catch(console.error);
