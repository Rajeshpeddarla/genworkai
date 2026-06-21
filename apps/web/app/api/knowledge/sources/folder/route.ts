import { NextResponse } from 'next/server';
import { db } from '../../../../../db';
import { knowledgeSources, syncJobs } from '../../../../../db/schema';
import { inngest } from '../../../../../inngest/client';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import { validateUpload } from '../../../../../lib/security/uploads';
import { requireUser, requireOwnership } from '../../../../../lib/auth';
import { RateLimitService } from '../../../../../lib/security/rate-limit';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}



export async function POST(req: Request) {
  try {
    const { user, error: authError } = await requireUser();
    if (authError) return authError;

    const rateLimitResponse = await RateLimitService.check(user.id, 'upload');
    if (rateLimitResponse) return rateLimitResponse;

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const kbIdStr = formData.get('kbId') as string | null;

    if (!file || !kbIdStr) {
      return NextResponse.json({ error: 'ZIP File and kbId are required' }, { status: 400, headers: corsHeaders });
    }

    const kbId = parseInt(kbIdStr, 10);
    
    const ownershipError = await requireOwnership('knowledge_base', kbId, user.id);
    if (ownershipError) return ownershipError;

    const { valid, error: validationError, status } = validateUpload(file, 'archive');
    if (!valid) {
      return NextResponse.json({ error: validationError }, { status: status || 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Create the Folder Source
    const newSource = await db.insert(knowledgeSources).values({
      kbId,
      name: file.name,
      type: 'folder',
      classification: { category: 'project', type: 'folder', language: 'mixed' },
      syncStatus: 'pending'
    }).returning();
    
    const sourceId = newSource[0]!.id;

    // Create a Sync Job
    const syncJob = await db.insert(syncJobs).values({
      sourceId,
      status: 'queued',
      startedAt: new Date()
    }).returning();

    // 1. Save buffer to a temporary file
    const tempDir = os.tmpdir();
    const tempFileName = `folder_upload_${crypto.randomUUID()}.zip`;
    const tempFilePath = path.join(tempDir, tempFileName);
    
    await fs.writeFile(tempFilePath, buffer);

    // 2. Dispatch to Inngest Worker
    await inngest.send({
      name: 'knowledge/process.folder',
      data: {
        sourceId,
        syncJobId: syncJob[0]!.id,
        filePath: tempFilePath,
        originalName: file.name
      }
    });

    return NextResponse.json({ success: true, sourceId, syncJobId: syncJob[0]!.id }, { headers: corsHeaders });

  } catch (error: any) {
    console.error('Folder Upload error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process folder' }, { status: 500, headers: corsHeaders });
  }
}

