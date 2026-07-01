import { db } from "../db";
import { profiles, systemConfig } from "../db/schema";
import { eq } from "drizzle-orm";
import { EntitlementEngine } from "./billing/entitlements";

const DEFAULT_REFERRAL_REWARDS = {
  extraKbs: 1,
  extraArtifacts: 25,
  extraContextBytes: 1_000_000,
};

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
  if (profile.isAdmin) return { allowed: true, limit: -1, current: 0 };

  const bonus = await getReferralBonus(profile);
  const result = await EntitlementEngine.checkLimit({ userId, resource: 'knowledge_bases' });
  
  const finalLimit = result.limit === -1 ? -1 : (result.limit || 0) + bonus.extraKbs;
  const current = result.currentUsage || 0;
  
  return {
    allowed: finalLimit === -1 ? true : current < finalLimit,
    limit: finalLimit,
    current,
  };
}

export async function checkContextLimit(userId: string): Promise<{ allowed: boolean; limit: number; current: number }> {
  const profile = await getUserProfile(userId);
  if (!profile) return { allowed: false, limit: 0, current: 0 };
  if (profile.isAdmin) return { allowed: true, limit: -1, current: 0 };

  const bonus = await getReferralBonus(profile);
  const result = await EntitlementEngine.checkLimit({ userId, resource: 'context_size' });
  
  const finalLimit = result.limit === -1 ? -1 : (result.limit || 0) + bonus.extraContextBytes;
  const current = result.currentUsage || 0;

  return {
    allowed: finalLimit === -1 ? true : current < finalLimit,
    limit: finalLimit,
    current,
  };
}

export async function checkFlowLimit(userId: string): Promise<{ allowed: boolean; limit: number; current: number }> {
  const profile = await getUserProfile(userId);
  if (!profile) return { allowed: false, limit: 0, current: 0 };
  if (profile.isAdmin) return { allowed: true, limit: -1, current: 0 };

  const result = await EntitlementEngine.checkLimit({ userId, resource: 'automations' });
  
  const finalLimit = result.limit === -1 ? -1 : (result.limit || 0);
  const current = result.currentUsage || 0;

  return {
    allowed: finalLimit === -1 ? true : current < finalLimit,
    limit: finalLimit,
    current,
  };
}

export async function checkArtifactLimit(userId: string): Promise<{ allowed: boolean; limit: number; current: number }> {
  const profile = await getUserProfile(userId);
  if (!profile) return { allowed: false, limit: 0, current: 0 };
  if (profile.isAdmin) return { allowed: true, limit: -1, current: 0 };

  const bonus = await getReferralBonus(profile);
  const result = await EntitlementEngine.checkLimit({ userId, resource: 'workspaces' });
  
  const finalLimit = result.limit === -1 ? -1 : (result.limit || 0) + bonus.extraArtifacts;
  const current = result.currentUsage || 0;

  return {
    allowed: finalLimit === -1 ? true : current < finalLimit,
    limit: finalLimit,
    current,
  };
}
