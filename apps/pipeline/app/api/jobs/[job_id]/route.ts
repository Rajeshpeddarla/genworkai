import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ job_id: string }> }
) {
  try {
    const { job_id } = await params;

    if (!job_id) {
      return NextResponse.json({ error: 'No job_id provided' }, { status: 400 });
    }

    const fastapiUrl = process.env.FASTAPI_URL || 'http://localhost:8000';
    
    const response = await fetch(`${fastapiUrl}/api/v1/jobs/${job_id}`);

    if (!response.ok) {
      // If FastAPI returns 404, it might mean the job finished and was removed from the queue,
      // or we need to check the DB. For now, just pass the status back.
      if (response.status === 404) {
        return NextResponse.json({ error: 'Job not found on worker' }, { status: 404 });
      }
      const text = await response.text();
      console.error('FastAPI error fetching job:', text);
      return NextResponse.json({ error: 'Failed to fetch job status from ingestion service' }, { status: 500 });
    }

    const jobData = await response.json();
    
    // jobData contains: job_id, status (queued, started, deferred, finished, stopped, canceled, failed), result
    let statusMap = "uploading";
    
    if (jobData.status === "queued" || jobData.status === "deferred") {
      statusMap = "uploading";
    } else if (jobData.status === "started") {
      statusMap = "extracting";
    } else if (jobData.status === "finished") {
      statusMap = "complete";
    } else if (jobData.status === "failed" || jobData.status === "stopped" || jobData.status === "canceled") {
      statusMap = "error";
    }

    return NextResponse.json({
      job_id: jobData.job_id,
      status: statusMap,
      raw_status: jobData.status,
      result: jobData.result
    });

  } catch (error: any) {
    console.error('Job polling error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
