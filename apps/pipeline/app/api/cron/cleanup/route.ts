import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Client } from "pg";

export async function GET(request: Request) {
  // Simple cron authorization check (e.g. from Vercel Cron)
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET && 
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return NextResponse.json({ error: "Database misconfiguration" }, { status: 500 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  const client = new Client({ connectionString });
  
  try {
    await client.connect();

    // 1. Find all documents older than 7 days
    const res = await client.query(`
      SELECT id, extracted_data
      FROM baseparse_documents 
      WHERE created_at < NOW() - INTERVAL '7 days'
    `);

    let deletedImagesCount = 0;
    const documentIdsToDelete = [];

    // 2. Extract image URLs and delete from Supabase Storage
    for (const row of res.rows) {
      documentIdsToDelete.push(row.id);
      
      try {
        const data = typeof row.extracted_data === 'string' ? JSON.parse(row.extracted_data) : row.extracted_data;
        
        if (data && data.pages) {
          for (const page of data.pages) {
            if (page.blocks) {
              for (const block of page.blocks) {
                if (block.image_url) {
                  // Example URL: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
                  try {
                    const url = new URL(block.image_url);
                    const pathParts = url.pathname.split('/storage/v1/object/public/');
                    if (pathParts.length > 1) {
                      const fullPath = pathParts[1];
                      const bucketName = fullPath.substring(0, fullPath.indexOf('/'));
                      const filePath = fullPath.substring(fullPath.indexOf('/') + 1);
                      
                      if (bucketName && filePath) {
                        const { error } = await supabase.storage.from(bucketName).remove([filePath]);
                        if (!error) deletedImagesCount++;
                      }
                    }
                  } catch (e) {
                    console.error("Failed to parse or delete image_url:", block.image_url, e);
                  }
                }
              }
            }
          }
        }
      } catch (e) {
        console.error("Failed to parse extracted_data for doc", row.id);
      }
    }

    // 3. Delete documents from database
    if (documentIdsToDelete.length > 0) {
      // Using ANY allows us to pass the array directly to postgres
      await client.query(`
        DELETE FROM baseparse_documents 
        WHERE id = ANY($1::int[])
      `, [documentIdsToDelete]);
    }

    return NextResponse.json({ 
      success: true, 
      message: "Cleanup completed successfully",
      documentsDeleted: documentIdsToDelete.length,
      imagesDeleted: deletedImagesCount
    });

  } catch (error: any) {
    console.error("Cleanup error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    await client.end();
  }
}
