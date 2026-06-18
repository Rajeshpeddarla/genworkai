import { NextResponse } from 'next/server';
import { db } from '../../../../db';
import { knowledgeBases, documents } from '../../../../db/schema';
import { eq } from 'drizzle-orm';
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
    const docs = await db.select().from(documents);
    
    // Group documents by KB
    const kbWithDocs = kbs.map((kb: any) => {
      const kbDocs = docs.filter(d => d.kbId === kb.id);
      return { ...kb, documents: kbDocs, documentCount: kbDocs.length };
    });

    return NextResponse.json({ kbs: kbWithDocs });
  } catch (error: unknown) {
    return safeErrorResponse(error, 'List Knowledge Bases Route');
  }
}
// force turbopack reload
