import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getUserProfile, checkKnowledgeBaseLimit, checkFlowLimit, checkArtifactLimit, checkContextLimit } from '@/lib/limits';

export async function GET() {
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
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let profile = await getUserProfile(user.id);

    // Auto-create profile if missing (fixes 0/0 limits bug on first signup)
    if (!profile) {
      const { db } = await import('@/db');
      const { profiles } = await import('@/db/schema');
      
      const emailName = user.email ? user.email.split('@')[0] : 'User';
      const fullName = user.user_metadata?.full_name || emailName;
      
      // Generate a unique referral code
      const referralCode = `${fullName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 5)}${Math.floor(Math.random() * 1000)}`;

      await db.insert(profiles).values({
        id: user.id,
        email: user.email!,
        fullName: fullName,
        referralCode: referralCode,
      });
      
      profile = await getUserProfile(user.id);
    }

    const kbLimit = await checkKnowledgeBaseLimit(user.id);
    const flowLimit = await checkFlowLimit(user.id);
    const artifactLimit = await checkArtifactLimit(user.id);
    const contextLimit = await checkContextLimit(user.id);

    // Fetch referral data
    let referrals = { count: 0, members: [] as any[] };
    if (profile?.referralCode) {
      const { db } = await import('@/db');
      const { profiles } = await import('@/db/schema');
      const { eq } = await import('drizzle-orm');
      
      const referredUsers = await db.select({
        id: profiles.id,
        fullName: profiles.fullName,
        tier: profiles.tier,
        createdAt: profiles.createdAt
      }).from(profiles).where(eq(profiles.referredBy, profile.referralCode));
      
      referrals.count = referredUsers.length;
      referrals.members = referredUsers;
    }

    return NextResponse.json({
      profile,
      referrals,
      limits: {
        knowledgeBases: kbLimit,
        flows: flowLimit,
        artifacts: artifactLimit,
        context: contextLimit
      }
    });
  } catch (error: any) {
    console.error("Profile fetch error:", error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}
