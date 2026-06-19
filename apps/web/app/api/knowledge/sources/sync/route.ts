import { NextResponse } from 'next/server';
import { db } from '../../../../../db';
import { knowledgeSources } from '../../../../../db/schema';
import { eq } from 'drizzle-orm';
import { requireUser, requireOwnership } from '../../../../../lib/auth';
import { getCorsHeaders } from '../../../../../lib/security/cors';

export async function OPTIONS(req: Request) {
  return NextResponse.json({}, { headers: getCorsHeaders(req.headers.get('origin')) });
}

export async function POST(req: Request) {
  try {
    const { user, error: authError } = await requireUser();
    if (authError) return authError;

    const { sourceId } = await req.json();

    if (!sourceId) {
      return NextResponse.json({ error: 'sourceId is required' }, { status: 400, headers: getCorsHeaders(req.headers.get('origin')) });
    }

    const ownershipError = await requireOwnership('source', parseInt(sourceId, 10), user.id);
    if (ownershipError) return ownershipError;

    // 1. Fetch Source
    const sources = await db.select().from(knowledgeSources).where(eq(knowledgeSources.id, parseInt(sourceId, 10))).limit(1);
    const source = sources[0];

    if (!source) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404, headers: getCorsHeaders(req.headers.get('origin')) });
    }

    const host = req.headers.get('host');
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}/api/knowledge/sources`;

    // 2. Dispatch to the right route based on type
    let targetEndpoint = '';
    let payload: any = { kbId: source.kbId };

    if (source.type === 'github') {
      targetEndpoint = `${baseUrl}/github`;
      const config = source.configuration as any;
      payload.repoUrl = config.repoUrl;
      payload.branch = config.branch;
      // Note: We don't have the oauthToken stored for security reasons in this simple V1 setup.
      // In production, we'd retrieve it from a secure vault using sourceId.
    } else if (source.type === 'website') {
      targetEndpoint = `${baseUrl}/website`;
      payload.url = (source.configuration as any).url;
    } else if (source.type === 'api') {
      targetEndpoint = `${baseUrl}/api`;
      payload.url = (source.configuration as any).url;
    } else if (source.type === 'database') {
       return NextResponse.json({ error: 'Auto-syncing databases requires secure vault integration for credentials (Not available in V1).' }, { status: 400, headers: getCorsHeaders(req.headers.get('origin')) });
    } else if (source.type === 'folder') {
       return NextResponse.json({ error: 'Folder sources must be manually re-uploaded to sync.' }, { status: 400, headers: getCorsHeaders(req.headers.get('origin')) });
    } else {
      return NextResponse.json({ error: `Unsupported source type for auto-sync: ${source.type}` }, { status: 400, headers: getCorsHeaders(req.headers.get('origin')) });
    }

    // Fire and forget the sync request (or await it depending on needs)
    // We will await it for V1 to ensure it completes, though it might hit serverless timeouts.
    const syncRes = await fetch(targetEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!syncRes.ok) {
      const err = await syncRes.json();
      return NextResponse.json({ error: `Sync failed: ${err.error || syncRes.statusText}` }, { status: syncRes.status, headers: getCorsHeaders(req.headers.get('origin')) });
    }

    const syncData = await syncRes.json();

    return NextResponse.json({ success: true, message: 'Sync completed', data: syncData }, { headers: getCorsHeaders(req.headers.get('origin')) });

  } catch (error: any) {
    console.error('Sync Job error:', error);
    return NextResponse.json({ error: error.message || 'Failed to trigger sync' }, { status: 500, headers: getCorsHeaders(req.headers.get('origin')) });
  }
}
