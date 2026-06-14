import { NextResponse } from 'next/server';
import { db } from '@/db';
import { systemConfig, profiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSystemLimits, getReferralRewards } from '@/lib/limits';

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const adminCheck = await db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1);
    if (!adminCheck[0]?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const limits = await getSystemLimits();
    const referralRewards = await getReferralRewards();

    return NextResponse.json({ limits, referralRewards });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
  } catch (error: any) {
    console.error("Config save error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
