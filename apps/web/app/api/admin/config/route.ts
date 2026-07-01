import { NextResponse } from 'next/server';
import { db } from '@/db';
import { systemConfig, profiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth';
import { safeErrorResponse } from '@/lib/errors';
import { getReferralRewards } from '@/lib/limits';

export async function GET(req: Request) {
  try {
    const { user, error } = await requireAdmin();
    if (error) return error;

    const limitConfig = await db.select().from(systemConfig).where(eq(systemConfig.key, 'SYSTEM_LIMITS')).limit(1);
    const limits = limitConfig[0]?.value || {};
    const referralRewards = await getReferralRewards();

    return NextResponse.json({ limits, referralRewards });
  } catch (error: unknown) {
    return safeErrorResponse(error, 'Admin Config GET Route');
  }
}

export async function POST(req: Request) {
  try {
    const { user, error } = await requireAdmin();
    if (error) return error;

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
