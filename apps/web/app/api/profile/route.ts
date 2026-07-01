import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { safeErrorResponse } from '@/lib/errors';
import { getUserProfile, checkKnowledgeBaseLimit, checkFlowLimit, checkArtifactLimit, checkContextLimit } from '@/lib/limits';

export async function GET() {
  try {
    const { user, error } = await requireUser();
    if (error) return error;

    let profile = await getUserProfile(user.id);

    // Auto-create profile if missing (fixes 0/0 limits bug on first signup)
    if (!profile) {
      const { db } = await import('@/db');
      const { profiles } = await import('@/db/schema');
      
      const emailName = user.email ? user.email.split('@')[0] : 'User';
      const fullName = (user as any).user_metadata?.full_name || emailName;
      
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

    const { UsageService } = await import('@/lib/billing/UsageService');
    const balance = await UsageService.getOrCreateBalance(user.id);
    const aiCredits = {
      current: (balance?.monthlyRemainingCredits || 0) + (balance?.purchasedRemainingCredits || 0),
      monthly: balance?.monthlyRemainingCredits || 0,
      purchased: balance?.purchasedRemainingCredits || 0,
      resetAt: balance?.monthlyResetAt,
      monthlyLimit: 0 // Will populate after fetching plan
    };

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

      const { db: dbLocal } = await import('@/db');
      const { subscriptionPlans } = await import('@/db/schema');
      const { eq: eqLocal } = await import('drizzle-orm');
      
      const activePlans = await dbLocal.select().from(subscriptionPlans).where(eqLocal(subscriptionPlans.isActive, true));
      
      const userPlan = activePlans.find(p => p.slug === profile?.tier) || activePlans.find(p => p.slug === 'free');
      if (userPlan) {
        aiCredits.monthlyLimit = userPlan.monthlyAiCredits ?? 0;
      }

    return NextResponse.json({
      profile,
      referrals,
      plans: activePlans,
      limits: {
        knowledgeBases: kbLimit,
        flows: flowLimit,
        artifacts: artifactLimit,
        context: contextLimit,
        aiCredits: aiCredits
      }
    });
  } catch (error: unknown) {
    console.error("API Profile Error:", error);
    return safeErrorResponse(error, 'Get Profile Route');
  }
}
