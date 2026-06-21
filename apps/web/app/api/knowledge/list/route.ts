import { NextResponse } from 'next/server';
import { db } from '../../../../db';
import { knowledgeBases, documents } from '../../../../db/schema';
import { eq, inArray, sql } from 'drizzle-orm';
import { requireUser } from '../../../../lib/auth';
import { safeErrorResponse } from '../../../../lib/errors';
import { RateLimitService } from '../../../../lib/security/rate-limit';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { user, error } = await requireUser();
    if (error) return error;

    const rateLimitResponse = await RateLimitService.check(user.id, 'default');
    if (rateLimitResponse) return rateLimitResponse;

    const kbs = await db.select().from(knowledgeBases).where(eq(knowledgeBases.userId, user.id));
    
    let kbWithDocs: any[] = [];
    if (kbs.length > 0) {
      const kbIds = kbs.map(kb => kb.id);
      
      // Get document counts per KB efficiently using SQL GROUP BY
      const docCounts = await db.select({
        kbId: documents.kbId,
        count: sql<number>`count(*)::int`
      })
      .from(documents)
      .where(inArray(documents.kbId, kbIds))
      .groupBy(documents.kbId);

      // Create a map for quick lookup
      const countMap = new Map(docCounts.map(dc => [dc.kbId, dc.count]));

      kbWithDocs = kbs.map((kb: any) => {
        return { 
          ...kb, 
          documents: [], // Do not return all docs in the list view to save memory and bandwidth
          documentCount: countMap.get(kb.id) || 0 
        };
      });
    }

    return NextResponse.json({ kbs: kbWithDocs });
  } catch (error: unknown) {
    return safeErrorResponse(error, 'List Knowledge Bases Route');
  }
}
// force turbopack reload
