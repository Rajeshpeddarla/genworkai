import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const fileBuffer = await file.arrayBuffer();
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    
    // 1. Save file locally for the worker to pick up via shared volume
    const fs = require('fs');
    const path = require('path');
    const uploadDir = path.join(process.cwd(), '..', 'web', 'public', 'uploads');
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, Buffer.from(fileBuffer));

    // Mock Document ID (Max Postgres INTEGER is 2,147,483,647)
    let documentId = Math.floor(Math.random() * 1000000); 

    // Try inserting into the documents table if it exists (Optional for now)
    const { data: docData, error: docError } = await supabase
      .from('documents')
      .insert([
        { title: file.name, source_type: 'pdf', status: 'uploaded' }
      ])
      .select()
      .single();

    if (!docError && docData) {
      documentId = docData.id;
    } else {
      console.warn("DB insert skipped/failed, using mock document ID:", docError);
    }

    // 2. Trigger FastAPI Ingestion Service
    const ingestPayload = {
      document_id: documentId,
      storage_key: fileName,
      mime_type: file.type
    };

    const fastapiUrl = process.env.FASTAPI_URL || 'http://localhost:8000';
    
    const response = await fetch(`${fastapiUrl}/api/v1/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ingestPayload)
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('FastAPI error:', text);
      return NextResponse.json({ error: 'Failed to trigger ingestion service' }, { status: 500 });
    }

    const jobData = await response.json();

    return NextResponse.json({
      success: true,
      job_id: jobData.job_id,
      document_id: documentId,
      storage_key: fileName
    });

  } catch (error: any) {
    console.error('Upload route error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
