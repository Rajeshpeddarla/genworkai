import { NextResponse } from 'next/server';
import { db } from '../../../../../db';
import { apiEndpoints } from '../../../../../db/schema';
import { eq, and } from 'drizzle-orm';
import { requireUser } from '../../../../../lib/auth';
import { safeErrorResponse } from '../../../../../lib/errors';
import { RateLimitService } from '../../../../../lib/security/rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { user, error } = await requireUser();
    if (error) return error;

    const rateLimitResponse = await RateLimitService.check(user.id, 'default');
    if (rateLimitResponse) return rateLimitResponse;

    const resolvedParams = await params;

    const [api] = await db.select()
      .from(apiEndpoints)
      .where(and(eq(apiEndpoints.userId, user.id), eq(apiEndpoints.slug, resolvedParams.slug)));

    if (!api) {
      return NextResponse.json({ error: "API not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, api });
  } catch (error: unknown) {
    return safeErrorResponse(error, 'Get API Endpoint Route');
  }
}
