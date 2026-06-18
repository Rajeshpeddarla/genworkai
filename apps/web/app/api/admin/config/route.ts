import { NextResponse } from 'next/server';
import { db } from '@/db';
import { systemConfig, profiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireUser } from '@/lib/auth';
import { safeErrorResponse } from '@/lib/errors';
import { getSystemLimits, getReferralRewards } from '@/lib/limits';

export async function GET(req: Request) {
  try {
    const { user, error } = await requireUser();
    if (error) return error;

    const adminCheck = await db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1);
    if (!adminCheck[0]?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const limits = await getSystemLimits();
    const referralRewards = await getReferralRewards();

    return NextResponse.json({ limits, referralRewards });
  } catch (error: unknown) {
    return safeErrorResponse(error, 'Admin Config GET Route');
  }
}

export async function POST(req: Request) {
  try {
    const { user, error } = await requireUser();
    if (error) return error;

    const adminCheck = await db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1);
    if (!adminCheck[0]?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { key, value } = await req.json();
    if (!key || !value) return NextResponse.json({ error: 'Missing key or value' }, { status: 400 });

    const existing = await db.select().from(systemConfig).where(eq(systemConfig.key, key)).limit(1);
    
    if (existing.length > 0) {
      await db.update(systemConfig).set({ value, updatedAt: new Date() }).where(eq(systemConfig.key, key));
    } else {
      await db.insert(systemConfig).values({ key, value });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return safeErrorResponse(error, 'Admin Config POST Route');
  }
}
