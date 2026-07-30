import { NextResponse } from "next/server";
import { Client } from "pg";

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const fileHash = searchParams.get('file_hash');
    const fileType = searchParams.get('file_type');
    const fileName = searchParams.get('file_name');

    if (!userId || !fileHash || !fileName) {
      return NextResponse.json({ error: "Missing query parameters" }, { status: 400 });
    }

    const payload = await request.json();
    const { job_id, extracted_data, processing_time_ms } = payload;

    if (!job_id) {
      return NextResponse.json({ error: "Missing job_id" }, { status: 400 });
    }

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      return NextResponse.json({ error: "Database misconfiguration" }, { status: 500 });
    }

    const client = new Client({ connectionString });
    await client.connect();

    if (extracted_data.error) {
       await client.query(`
        UPDATE baseparse_documents 
        SET status = 'error', extracted_data = $1 
        WHERE id = $2
      `, [JSON.stringify(extracted_data), job_id]);
      
      await client.query(`
        INSERT INTO request_logs (user_id, file_name, status, execution_time_ms, request_metadata)
        VALUES ($1, $2, $3, $4, $5)
      `, [userId, fileName, 'error', processing_time_ms, JSON.stringify(extracted_data)]);
      
      await client.end();
      return NextResponse.json({ success: true, message: "Error logged" });
    }

    // It's a success
    const realPageCount = extracted_data.document?.pages || 1;
    
    // Wrap extracted data in the new architectural envelope
    const finalExtractedData = {
      schema_version: "1.0",
      job: {
        id: job_id,
        status: "completed",
        created_at: new Date(Date.now() - processing_time_ms).toISOString(),
        completed_at: new Date().toISOString()
      },
      document: {
        id: `doc_${Date.now()}`,
        filename: fileName,
        page_count: realPageCount,
        document_type: fileType || "application/pdf",
        languages: ["en"],
        processing_time_ms: processing_time_ms
      },
      pages: extracted_data.pages || [],
      usage: {
        pages_processed: realPageCount,
        pages_retried: 0,
        input_tokens: extracted_data.usage?.input_tokens || 0,
        output_tokens: extracted_data.usage?.output_tokens || 0,
        processing_seconds: Math.round(processing_time_ms / 1000)
      },
      warnings: []
    };

    // Update Billing
    const planRes = await client.query(`
      SELECT up.id, up.pages_extracted_this_month, p.page_extraction_limit 
      FROM baseparse_user_plans up
      LEFT JOIN baseparse_pricing_plans p ON p.id = up.plan_id
      WHERE up.user_id = $1
    `, [userId]);

    if (planRes.rows.length > 0) {
      const userPlan = planRes.rows[0];
      await client.query(`
        UPDATE baseparse_user_plans 
        SET pages_extracted_this_month = pages_extracted_this_month + $1 
        WHERE id = $2
      `, [realPageCount, userPlan.id]);
    }

    // Update Document
    await client.query(`
      UPDATE baseparse_documents 
      SET status = 'completed', page_count = $1, extracted_data = $2, checksum = $3
      WHERE id = $4
    `, [realPageCount, JSON.stringify(finalExtractedData), fileHash, job_id]);

    // Log Request
    await client.query(`
      INSERT INTO request_logs (user_id, file_name, status, execution_time_ms, request_metadata)
      VALUES ($1, $2, $3, $4, $5)
    `, [userId, fileName, 'success', processing_time_ms, JSON.stringify({ pages: realPageCount, tokens: finalExtractedData.usage })]);

    await client.end();

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
