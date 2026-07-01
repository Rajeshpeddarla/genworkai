import { NextResponse } from 'next/server';
import { db } from '@/db';
import { eq, desc, and } from 'drizzle-orm';
import { automationOutputs } from '@/db/schema';
import { requireUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const { user, error } = await requireUser();
    if (error) return error;

    const url = new URL(req.url);
    const moduleName = url.searchParams.get('module');

    if (!moduleName) {
      return NextResponse.json({ error: 'Module name is required' }, { status: 400 });
    }

    const history = await db.select()
      .from(automationOutputs)
      .where(and(
        eq(automationOutputs.module, moduleName),
        eq(automationOutputs.userId, user.id)
      ))
      .orderBy(desc(automationOutputs.createdAt))
      .limit(20);

    return NextResponse.json({ success: true, history });
  } catch (error: any) {
    console.error('History fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
