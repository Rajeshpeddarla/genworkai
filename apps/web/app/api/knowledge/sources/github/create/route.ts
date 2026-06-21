import { NextResponse } from 'next/server';
import { db } from '../../../../../../db';
import { knowledgeSources, syncJobs } from '../../../../../../db/schema';
import { requireUser, requireOwnership } from '../../../../../../lib/auth';

export async function POST(req: Request) {
  try {
    const { kbId, repo } = await req.json();

    if (!kbId || !repo) {
      return NextResponse.json({ error: 'kbId and repo are required' }, { status: 400 });
    }

    const authResult = await requireUser();
    if (authResult.error) return authResult.error;

    const ownershipError = await requireOwnership('knowledge_base', kbId, authResult.user.id);
    if (ownershipError) return ownershipError;

    // Create the Knowledge Source
    const newSource = await db.insert(knowledgeSources).values({
      userId: authResult.user.id,
      kbId,
      name: repo.fullName,
      type: 'github',
      configuration: {
        installationId: repo.installationId,
        owner: repo.ownerLogin,
        repo: repo.name,
        branch: repo.defaultBranch,
        url: repo.url
      },
      classification: {
        isPrivate: repo.private
      },
      syncStatus: 'pending'
    }).returning();

    const source = newSource[0];
    if (!source) {
      throw new Error("Failed to create source record in database.");
    }

    // Kick off an initial sync job
    await db.insert(syncJobs).values({
      sourceId: source.id,
      status: 'queued'
    });

    // Note: In a production environment, you would trigger a background worker (e.g. Inngest, BullMQ, or AWS SQS) here
    // to actually process the repo. For V1 MVP, the job sits in queued state and a separate polling process 
    // or direct invocation would process it.

    return NextResponse.json({ success: true, source });

  } catch (error: any) {
    console.error('Create GitHub Source API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create source' }, { status: 500 });
  }
}
