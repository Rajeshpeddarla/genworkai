const { Client } = require('pg');

const client = new Client({ 
    connectionString: 'postgresql://postgres.ctyzlvywuginxxrrgdsj:DTQfM%21Mp1v5%5EZBsG53Rd@aws-1-ap-south-1.pooler.supabase.com:6543/postgres' 
});

async function run() {
    await client.connect();
    
    try { 
        await client.query('ALTER TABLE document_chunks ADD COLUMN assets jsonb;'); 
        console.log('Added assets to document_chunks'); 
    } catch(e) { console.log(e.message); } 
    
    try { 
        await client.query(`CREATE TABLE support_tickets (
            id SERIAL PRIMARY KEY, 
            user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, 
            subject VARCHAR(255) NOT NULL, 
            message TEXT NOT NULL, 
            status VARCHAR(50) DEFAULT 'pending', 
            created_at TIMESTAMP DEFAULT NOW(), 
            updated_at TIMESTAMP DEFAULT NOW()
        );`); 
        console.log('Created support_tickets'); 
    } catch(e) { console.log(e.message); } 
    
    try { 
        await client.query(`CREATE TABLE pricing_plans (
            id SERIAL PRIMARY KEY, 
            name VARCHAR(255) NOT NULL, 
            credits INTEGER NOT NULL, 
            price NUMERIC(10, 2) NOT NULL, 
            currency VARCHAR(10) DEFAULT 'USD', 
            is_active BOOLEAN DEFAULT TRUE, 
            created_at TIMESTAMP DEFAULT NOW(), 
            updated_at TIMESTAMP DEFAULT NOW()
        );`); 
        console.log('Created pricing_plans'); 
    } catch(e) { console.log(e.message); } 
    
    await client.end();
}

run().catch(console.error);
