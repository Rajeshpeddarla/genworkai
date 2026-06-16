import { db } from "../db";
import { profiles, knowledgeBases, businessFlows, workspaceChats, workspaceArtifacts, documents, systemConfig } from "../db/schema";
import { eq, count, sum, and, gte } from "drizzle-orm";

const DEFAULT_LIMITS = {
  free: {
    knowledgeBases: 1,
    flows: 10,
    artifactsPerMonth: 50,
    contextBytes: 5_000_000,
  },
  pro: {
    knowledgeBases: 9999,
    flows: 9999,
    artifactsPerMonth: 9999,
    contextBytes: 500_000_000,
  }
};

const DEFAULT_REFERRAL_REWARDS = {
  extraKbs: 1,
  extraArtifacts: 25,
  extraContextBytes: 1_000_000,
};

export async function getSystemLimits() {
  try {
    const config = await db.select().from(systemConfig).where(eq(systemConfig.key, 'TIER_LIMITS')).limit(1);
    if (config[0] && config[0].value) {
      return config[0].value as typeof DEFAULT_LIMITS;
    }
  } catch (e) {
    console.error("Failed to load tier limits from DB", e);
  }
  return DEFAULT_LIMITS;
}

export async function getReferralRewards() {
  try {
    const config = await db.select().from(systemConfig).where(eq(systemConfig.key, 'REFERRAL_REWARDS')).limit(1);
    if (config[0] && config[0].value) {
      return config[0].value as typeof DEFAULT_REFERRAL_REWARDS;
    }
  } catch (e) {
    console.error("Failed to load referral rewards from DB", e);
  }
  return DEFAULT_REFERRAL_REWARDS;
}

export async function getUserProfile(userId: string) {
  const result = await db.select().from(profiles).where(eq(profiles.id, userId)).limit(1);
  return result[0] || null;
}

export async function getReferralBonus(profile: any): Promise<{ extraKbs: number, extraArtifacts: number, extraContextBytes: number, hasActiveProReferral: boolean }> {
  if (!profile || !profile.referralCode) return { extraKbs: 0, extraArtifacts: 0, extraContextBytes: 0, hasActiveProReferral: false };
  
  const allReferrals = await db
    .select({ tier: profiles.tier, createdAt: profiles.createdAt })
    .from(profiles)
    .where(eq(profiles.referredBy, profile.referralCode));
    
  let totalReferrals = 0;
  let proReferrals = 0;
  let hasActiveProReferral = false;
  
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  
  for (const ref of allReferrals) {
    totalReferrals++;
    if (ref.tier === 'pro') {
       proReferrals++;
       if (ref.createdAt && new Date(ref.createdAt) > oneMonthAgo) {
          hasActiveProReferral = true;
       }
    }
  }

  const rewards = await getReferralRewards();
  
  return {
    extraKbs: proReferrals * rewards.extraKbs,
    extraArtifacts: proReferrals * rewards.extraArtifacts,
    extraContextBytes: totalReferrals * (rewards.extraContextBytes || 0),
    hasActiveProReferral
  };
}

export async function checkKnowledgeBaseLimit(userId: string): Promise<{ allowed: boolean; limit: number; current: number }> {
  const profile = await getUserProfile(userId);
  if (!profile) return { allowed: false, limit: 0, current: 0 };
  if (profile.isAdmin) return { allowed: true, limit: Infinity, current: 0 };

  const limits = await getSystemLimits();
  const bonus = await getReferralBonus(profile);
  const effectiveTier = (profile.tier === 'pro' || bonus.hasActiveProReferral) ? 'pro' : 'free';
  const tierLimits = limits[effectiveTier as keyof typeof limits] || limits.free;

  const kbCount = await db
    .select({ value: count() })
    .from(knowledgeBases)
    .where(eq(knowledgeBases.userId, userId));

  const current = kbCount[0]?.value ?? 0;
  const limit = tierLimits.knowledgeBases + bonus.extraKbs;

  return {
    allowed: current < limit,
    limit,
    current,
  };
}

export async function checkContextLimit(userId: string): Promise<{ allowed: boolean; limit: number; current: number }> {
  const profile = await getUserProfile(userId);
  if (!profile) return { allowed: false, limit: 0, current: 0 };
  if (profile.isAdmin) return { allowed: true, limit: Infinity, current: 0 };

  const limits = await getSystemLimits();
  const bonus = await getReferralBonus(profile);
  const effectiveTier = (profile.tier === 'pro' || bonus.hasActiveProReferral) ? 'pro' : 'free';
  const tierLimits = limits[effectiveTier as keyof typeof limits] || limits.free;

  const docSizes = await db
    .select({ value: sum(documents.sizeBytes) })
    .from(documents)
    .innerJoin(knowledgeBases, eq(documents.kbId, knowledgeBases.id))
    .where(eq(knowledgeBases.userId, userId));

  const current = parseInt((docSizes[0]?.value as string) || "0", 10);
  const limit = tierLimits.contextBytes + bonus.extraContextBytes;

  return {
    allowed: current < limit,
    limit,
    current,
  };
}

export async function checkFlowLimit(userId: string): Promise<{ allowed: boolean; limit: number; current: number }> {
  const profile = await getUserProfile(userId);
  if (!profile) return { allowed: false, limit: 0, current: 0 };
  if (profile.isAdmin) return { allowed: true, limit: Infinity, current: 0 };

  const limits = await getSystemLimits();
  const bonus = await getReferralBonus(profile);
  const effectiveTier = (profile.tier === 'pro' || bonus.hasActiveProReferral) ? 'pro' : 'free';
  const tierLimits = limits[effectiveTier as keyof typeof limits] || limits.free;

  const flowCount = await db
    .select({ value: count() })
    .from(businessFlows)
    .innerJoin(knowledgeBases, eq(businessFlows.kbId, knowledgeBases.id))
    .where(eq(knowledgeBases.userId, userId));

  const current = flowCount[0]?.value ?? 0;
  const limit = tierLimits.flows;

  return {
    allowed: current < limit,
    limit,
    current,
  };
}

export async function checkArtifactLimit(userId: string): Promise<{ allowed: boolean; limit: number; current: number }> {
  const profile = await getUserProfile(userId);
  if (!profile) return { allowed: false, limit: 0, current: 0 };
  if (profile.isAdmin) return { allowed: true, limit: Infinity, current: 0 };

  const limits = await getSystemLimits();
  const bonus = await getReferralBonus(profile);
  const effectiveTier = (profile.tier === 'pro' || bonus.hasActiveProReferral) ? 'pro' : 'free';
  const tierLimits = limits[effectiveTier as keyof typeof limits] || limits.free;

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const artifactCount = await db
    .select({ value: count() })
    .from(workspaceArtifacts)
    .innerJoin(workspaceChats, eq(workspaceArtifacts.chatId, workspaceChats.id))
    .where(
      and(
        eq(workspaceChats.userId, userId),
        gte(workspaceArtifacts.createdAt, startOfMonth)
      )
    );

  const current = artifactCount[0]?.value ?? 0;
  const limit = tierLimits.artifactsPerMonth + bonus.extraArtifacts;

  return {
    allowed: current < limit,
    limit,
    current,
  };
}
