const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.ctyzlvywuginxxrrgdsj:DTQfM%21Mp1v5%5EZBsG53Rd@aws-1-ap-south-1.pooler.supabase.com:6543/postgres' });
client.connect().then(async () => {
    try {
        const docRes = await client.query('SELECT id, title FROM documents ORDER BY created_at DESC LIMIT 1');
        const doc = docRes.rows[0];
        console.log('Latest Document:', doc.title, doc.id);
        const chunkRes = await client.query('SELECT page_number, content FROM document_chunks WHERE document_id = \'' + doc.id + '\'');
        const sorted = chunkRes.rows.sort((a, b) => a.page_number - b.page_number);
        for (const row of sorted) {
            console.log('\n--- PAGE ' + row.page_number + ' ---');
            console.log(row.content);
        }
    } catch (e) {
        console.error(e);
    } finally {
        client.end();
    }
});
