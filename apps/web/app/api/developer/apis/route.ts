import { NextResponse } from 'next/server';
import { db } from '../../../../db';
import { apiEndpoints } from '../../../../db/schema';
import { eq, desc } from 'drizzle-orm';
import { requireUser } from '../../../../lib/auth';
import { safeErrorResponse } from '../../../../lib/errors';
import { RateLimitService } from '../../../../lib/security/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { user, error } = await requireUser();
    if (error) return error;

    const rateLimitResponse = await RateLimitService.check(user.id, 'default');
    if (rateLimitResponse) return rateLimitResponse;

    const body = await req.json();
    const { name, slug, method, steps, knowledgeSources } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: "Name and Slug are required" }, { status: 400 });
    }

    // Convert steps to workflow format if needed, for now just save as JSON array
    const workflow = steps;

    const [newApi] = await db.insert(apiEndpoints).values({
      userId: user.id,
      name,
      slug,
      method: method || 'POST',
      workflow,
      knowledgeSources,
      isPublished: true,
    }).returning();

    return NextResponse.json({ success: true, api: newApi });
  } catch (error: any) {
    if (error.code === '23505') { // unique_violation in Postgres
      return NextResponse.json({ success: false, error: "An API with this slug already exists. Please choose a different slug." }, { status: 400 });
    }
    return safeErrorResponse(error, 'Create API Endpoint Route');
  }
}

export async function GET() {
  try {
    const { user, error } = await requireUser();
    if (error) return error;

    const rateLimitResponse = await RateLimitService.check(user.id, 'default');
    if (rateLimitResponse) return rateLimitResponse;

    const apis = await db.select()
      .from(apiEndpoints)
      .where(eq(apiEndpoints.userId, user.id))
      .orderBy(desc(apiEndpoints.createdAt));

    return NextResponse.json({ success: true, apis });
  } catch (error: unknown) {
    return safeErrorResponse(error, 'List API Endpoints Route');
  }
}
