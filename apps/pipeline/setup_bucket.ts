import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  await client.connect();
  console.log("Connected to DB");

  // Create the bucket
  try {
    await client.query(`
      INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
      VALUES ('baseparse-assets', 'baseparse-assets', true, null, null)
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log("Bucket created!");

    // Create policy to allow anonymous inserts and selects
    await client.query(`
      CREATE POLICY "Allow public inserts"
      ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'baseparse-assets');
    `);
    console.log("Insert policy created!");

    await client.query(`
      CREATE POLICY "Allow public select"
      ON storage.objects FOR SELECT TO public USING (bucket_id = 'baseparse-assets');
    `);
    console.log("Select policy created!");
  } catch (e) {
    console.error("Error setting up bucket/policies:", e);
  }

  await client.end();
}

main();
