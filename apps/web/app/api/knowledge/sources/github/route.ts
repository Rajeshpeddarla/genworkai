import { NextResponse } from 'next/server';
import { db } from '../../../../../db';
import { knowledgeSources, syncJobs } from '../../../../../db/schema';
import { inngest } from '../../../../../inngest/client';
import { eq, and } from 'drizzle-orm';
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

    const { repoUrl, kbId, oauthToken, branch = 'main' } = await req.json();

    if (!repoUrl || !kbId) {
      return NextResponse.json({ error: 'Repo URL and kbId are required' }, { status: 400, headers: corsHeaders });
    }

    const ownershipError = await requireOwnership('knowledge_base', parseInt(kbId, 10), user.id);
    if (ownershipError) return ownershipError;

    // Parse URL (e.g. https://github.com/owner/repo)
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) {
      return NextResponse.json({ error: 'Invalid GitHub URL' }, { status: 400, headers: corsHeaders });
    }
    const owner = match[1];
    const repo = match[2].replace('.git', '');

    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'GenWorkAI'
    };
    if (oauthToken) {
      headers['Authorization'] = `token ${oauthToken}`;
    }

    // 1. Fetch Repository Metadata
    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
    if (!repoRes.ok) {
      return NextResponse.json({ error: `Failed to fetch repo info: ${repoRes.statusText}` }, { status: repoRes.status, headers: corsHeaders });
    }
    const repoData = await repoRes.json();

    // 2. Fetch Latest Commit Hash
    const commitRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits/${branch}`, { headers });
    let latestHash = '';
    if (commitRes.ok) {
      const commitData = await commitRes.json();
      latestHash = commitData.sha;
    }

    // Determine basic classification
    const classification = {
      category: 'project',
      type: 'github',
      language: repoData.language ? repoData.language.toLowerCase() : 'mixed',
      framework: 'unknown', // Could be expanded by analyzing package.json later
      dependencies: [],
      entryPoints: []
    };

    // 3. Create or Update Knowledge Source
    const existingSources = await db.select().from(knowledgeSources).where(
      and(
        eq(knowledgeSources.kbId, parseInt(kbId, 10)), 
        eq(knowledgeSources.type, 'github')
      )
    ).limit(1);
    
    const existingSource = existingSources[0];

    let sourceId: number;
    
    if (existingSource) {
      // Very basic check: in production we would match the configuration->>'repoUrl'
      if (existingSource.latestHash === latestHash) {
        return NextResponse.json({ message: 'No new commits since last sync', sourceId: existingSource.id }, { headers: corsHeaders });
      }
      sourceId = existingSource.id;
      await db.execute(
        require('drizzle-orm').sql`UPDATE knowledge_sources SET sync_status = 'syncing' WHERE id = ${sourceId}`
      );
    } else {
      const newSource = await db.insert(knowledgeSources).values({
        kbId: parseInt(kbId, 10),
        name: repoData.full_name,
        type: 'github',
        classification,
        configuration: { repoUrl, owner, repo, branch, isPrivate: repoData.private },
        syncStatus: 'pending',
        latestHash
      }).returning();
      sourceId = newSource[0]!.id;
    }

    // Create a Sync Job
    const syncJob = await db.insert(syncJobs).values({
      sourceId,
      status: 'queued',
      startedAt: new Date()
    }).returning();

    // 4. Dispatch to Inngest
    await inngest.send({
      name: 'knowledge/process.github',
      data: {
        sourceId,
        syncJobId: syncJob[0]!.id,
        owner,
        repo,
        branch,
        oauthToken,
        classification
      }
    });

    return NextResponse.json({ success: true, sourceId, syncJobId: syncJob[0]!.id }, { headers: corsHeaders });

  } catch (error: any) {
    console.error('GitHub Import error:', error);
    return NextResponse.json({ error: error.message || 'Failed to import GitHub repo' }, { status: 500, headers: corsHeaders });
  }
}
