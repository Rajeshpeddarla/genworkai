import { NextResponse } from 'next/server';
import { db } from '../../../../db';
import { knowledgeSources, syncJobs, documents, documentProcessingLogs } from '../../../../db/schema';
import { inngest } from '../../../../inngest/client';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import { RateLimitService } from '../../../../lib/security/rate-limit';
import { validateUpload } from '../../../../lib/security/uploads';
import { requireUser, requireOwnership } from '../../../../lib/auth';
import { safeErrorResponse, ValidationError } from '../../../../lib/errors';
import { checkContextLimit } from '../../../../lib/limits';
import { CreditService } from '../../../../lib/billing/CreditService';

export async function POST(req: Request) {
  try {
    const { user, error } = await requireUser();
    if (error) return error;

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const kbIdStr = formData.get('kbId') as string | null;
    const sourceIdStr = formData.get('sourceId') as string | null;
    
    const url = new URL(req.url);
    const skipEnhance = url.searchParams.get('skipEnhance') === 'true';

    if (!file || !kbIdStr) {
      throw new ValidationError('File and kbId are required');
    }

    const kbId = parseInt(kbIdStr, 10);

    const ownershipError = await requireOwnership('knowledge_base', kbId, user.id);
    if (ownershipError) return ownershipError;

    let sourceId = sourceIdStr ? parseInt(sourceIdStr, 10) : null;
    const { valid, error: validationError, status } = validateUpload(file, 'document');
    if (!valid) {
      return NextResponse.json({ error: validationError }, { status: status || 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type;
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';

    const contextLimit = await checkContextLimit(user.id);
    if (!contextLimit.allowed || (contextLimit.limit !== -1 && contextLimit.current + buffer.length > contextLimit.limit)) {
      throw new Error(`Context limit reached. You can only upload up to ${(contextLimit.limit / 1000000).toFixed(1)}MB of data on the free plan.`);
    }

    // AI Credit Consumption (10 Credits per upload)
    const reserveResult = await CreditService.reserve(user.id, 'knowledge_ingestion', {
      featureCategory: 'knowledge',
      endpoint: '/api/knowledge/upload'
    });

    if (!reserveResult.success && process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ 
        error: { code: 'INSUFFICIENT_AI_CREDITS', message: reserveResult.reason || "You don't have enough AI Credits." } 
      }, { status: 403 });
    }

    // If no sourceId is provided, create a default "Files" source for this KB
    if (!sourceId) {
      let filesSource = await db.query.knowledgeSources.findFirst({
        where: (sources, { eq, and }) => and(eq(sources.kbId, kbId), eq(sources.type, 'file'))
      });
      if (!filesSource) {
        const newSource = await db.insert(knowledgeSources).values({
          userId: user.id,
          kbId,
          name: 'Direct Uploads',
          type: 'file',
          classification: { category: 'documents', type: 'files', language: 'mixed' }
        }).returning();
        filesSource = newSource[0];
      }
      sourceId = filesSource!.id;
    }

    // Create a Sync Job
    const syncJob = await db.insert(syncJobs).values({
      sourceId,
      status: 'queued',
      startedAt: new Date()
    }).returning();

    // Save buffer to persistent local storage (Development mode)
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadsDir, { recursive: true });
    
    const fileId = crypto.randomUUID();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storageKey = `upload_${fileId}_${safeName}`;
    const permanentPath = path.join(uploadsDir, storageKey);
    
    await fs.writeFile(permanentPath, buffer);
    const checksum = crypto.createHash('sha256').update(buffer).digest('hex');

    // Create the Document Manifest early in the lifecycle
    const newDoc = await db.insert(documents).values({
      kbId,
      sourceId,
      title: file.name,
      sourceType: fileExtension || 'unknown',
      mimeType,
      storageKey: storageKey,
      storageProvider: 'local',
      status: 'uploaded',
      sizeBytes: buffer.length,
      checksum,
    }).returning({ id: documents.id });

    const documentId = newDoc[0]!.id;

    // Create Document Processing Log
    await db.insert(documentProcessingLogs).values({
      documentId,
      stage: 'storage',
      status: 'success',
      message: 'Document permanently stored in local volume.',
    });

    // Dispatch to the new extraction orchestrator (FastAPI)
    try {
      const apiResponse = await fetch('http://localhost:8000/api/v1/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_id: documentId,
          storage_key: storageKey,
          mime_type: mimeType
        })
      });
      
      if (!apiResponse.ok) {
        console.error("FastAPI returned error", await apiResponse.text());
      }
    } catch (apiError) {
      console.error("Failed to call FastAPI ingest:", apiError);
    }

    return NextResponse.json({ success: true, sourceId, syncJobId: syncJob[0]!.id, documentId });

  } catch (error: unknown) {
    return safeErrorResponse(error, 'KB Document Upload Route');
  }
}

