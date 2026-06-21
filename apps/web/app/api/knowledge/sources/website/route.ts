import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { db } from '../../../../../db';
import { documents, documentChunks, knowledgeSources, syncJobs, sourceSnapshots } from '../../../../../db/schema';
import { inngest } from '../../../../../inngest/client';
import { eq, and } from 'drizzle-orm';
import { requireUser, requireOwnership } from '../../../../../lib/auth';
import { safeErrorResponse, ValidationError } from '../../../../../lib/errors';
import { validateUrl } from '../../../../../lib/security/url-validator';
import { RateLimitService } from '../../../../../lib/security/rate-limit';

export async function POST(req: Request) {
  try {
    // 1. Authentication & Rate Limiting
    const { user, error } = await requireUser();
    if (error) return error;

    const rateLimitResponse = await RateLimitService.check(user.id, 'upload');
    if (rateLimitResponse) return rateLimitResponse;

    const { url, kbId } = await req.json();

    if (!url || !kbId) {
      throw new ValidationError('URL and kbId are required');
    }

    const targetKbId = parseInt(kbId, 10);

    // 2. Ownership Verification
    const ownershipError = await requireOwnership('knowledge_base', targetKbId, user.id);
    if (ownershipError) return ownershipError;

    // 3. SSRF Validation
    const ssrfError = await validateUrl(url);
    if (ssrfError) {
      throw new ValidationError(`Invalid or unsafe URL: ${ssrfError}`);
    }



    // 2. Create or Update Source
    const existingSources = await db.select().from(knowledgeSources).where(
      and(
        eq(knowledgeSources.kbId, parseInt(kbId, 10)),
        eq(knowledgeSources.type, 'website')
      )
    ).limit(1);
    let existingSource = existingSources[0];

    let sourceId: number;
    if (existingSource) {
      sourceId = existingSource.id;
      // Note: We don't have the hash yet, the worker will check idempotency.
      await db.execute(
        require('drizzle-orm').sql`UPDATE knowledge_sources SET sync_status = 'pending' WHERE id = ${sourceId}`
      );
    } else {
      const newSource = await db.insert(knowledgeSources).values({
        kbId: parseInt(kbId, 10),
        name: `Website: ${new URL(url).hostname}`,
        type: 'website',
        classification: { category: 'documentation', type: 'website', language: 'mixed' },
        configuration: { url },
        syncStatus: 'pending',
      }).returning();
      sourceId = newSource[0]!.id;
    }

    // Create a Sync Job
    const syncJob = await db.insert(syncJobs).values({
      sourceId,
      status: 'queued',
      startedAt: new Date()
    }).returning();

    // 4. Dispatch to Inngest Worker
    await inngest.send({
      name: 'knowledge/process.website',
      data: {
        sourceId,
        syncJobId: syncJob[0]!.id,
        url
      }
    });

    return NextResponse.json({ success: true, sourceId, syncJobId: syncJob[0]!.id });

  } catch (error: unknown) {
    return safeErrorResponse(error, 'Website Import Route');
  }
}
