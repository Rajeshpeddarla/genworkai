const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.ctyzlvywuginxxrrgdsj:DTQfM%21Mp1v5%5EZBsG53Rd@aws-1-ap-south-1.pooler.supabase.com:6543/postgres' });
client.connect().then(async () => {
    try {
        const docRes = await client.query('SELECT id, title FROM documents ORDER BY created_at DESC LIMIT 1');
        const doc = docRes.rows[0];
        console.log('Latest Document:', doc.title, doc.id);
        const chunkRes = await client.query('SELECT page_number, content FROM document_chunks WHERE document_id = \'' + doc.id + '\'');
        
        let found = false;
        for (const row of chunkRes.rows) {
            if (row.content.includes('data:image/webp;base64')) {
                console.log('\n--- FOUND BASE64 IMAGE ON PAGE ' + row.page_number + ' ---');
                
                const match = row.content.match(/!\\[Diagram\\]\\(data:image\\/webp;base64,([A-Za-z0-9+/=]+)\\)/);
                if (match) {
                    console.log('Base64 Snippet (first 100 chars):', match[2].substring(0, 100) + '...');
                    console.log('Full length of base64 string:', match[2].length);
                    found = true;
                    // Print a bit of the surrounding text
                    const idx = row.content.indexOf(match[0]);
                    console.log('Context:\\n', row.content.substring(Math.max(0, idx - 100), idx + match[0].length + 100).replace(match[2], '<BASE64_DATA>'));
                    break;
                }
            }
        }
        if (!found) {
            console.log('No base64 images found yet. Maybe it is still processing?');
        }
    } catch (e) {
        console.error(e);
    } finally {
        client.end();
    }
});
