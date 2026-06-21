import { NextResponse } from 'next/server';
import { db } from '../../../../db';
import { knowledgeSources, syncJobs } from '../../../../db/schema';
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
    if (!contextLimit.allowed || contextLimit.current + buffer.length > contextLimit.limit) {
      throw new Error(`Context limit reached. You can only upload up to ${(contextLimit.limit / 1000000).toFixed(1)}MB of data on the free plan.`);
    }

    // If no sourceId is provided, create a default "Files" source for this KB
    if (!sourceId) {
      let filesSource = await db.query.knowledgeSources.findFirst({
        where: (sources, { eq, and }) => and(eq(sources.kbId, kbId), eq(sources.type, 'file'))
      });
      if (!filesSource) {
        const newSource = await db.insert(knowledgeSources).values({
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

    // Save buffer to a temporary file
    const tempDir = os.tmpdir();
    const tempFileName = `upload_${crypto.randomUUID()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const tempFilePath = path.join(tempDir, tempFileName);
    
    await fs.writeFile(tempFilePath, buffer);

    // Dispatch to Inngest Worker
    await inngest.send({
      name: 'knowledge/process.upload',
      data: {
        sourceId,
        syncJobId: syncJob[0]!.id,
        filePath: tempFilePath,
        originalName: file.name,
        mimeType
      }
    });

    return NextResponse.json({ success: true, sourceId, syncJobId: syncJob[0]!.id });

  } catch (error: unknown) {
    return safeErrorResponse(error, 'KB Document Upload Route');
  }
}

