import { db } from '../../db';
import { subscriptionPlans, userSubscriptions, usageCounters } from '../../db/schema';
import { eq, and } from 'drizzle-orm';

export interface EntitlementResult {
  allowed: boolean;
  reason?: string;
  currentUsage?: number;
  limit?: number;
}

export class EntitlementEngine {
  
  /**
   * Checks if a user has access to a specific boolean feature
   */
  static async hasFeature(userId: string, featureKey: keyof typeof subscriptionPlans.$inferSelect): Promise<EntitlementResult> {
    const activeSub = await this.getActiveSubscription(userId);
    
    if (!activeSub) {
      // Check if they are on a free plan fallback, otherwise deny
      const freePlan = await db.query.subscriptionPlans.findFirst({
        where: eq(subscriptionPlans.slug, 'free')
      });
      
      if (!freePlan || !freePlan[featureKey]) {
        return { allowed: false, reason: 'No active subscription or feature disabled on free plan' };
      }
      return { allowed: true };
    }

    const plan = await db.query.subscriptionPlans.findFirst({
      where: eq(subscriptionPlans.id, activeSub.planId!)
    });

    if (!plan || !plan[featureKey]) {
      return { allowed: false, reason: `Feature ${String(featureKey)} is not included in your current plan` };
    }

    return { allowed: true };
  }

  /**
   * Checks if a user is within their allowed limit for a quantifiable resource
   */
  static async checkLimit(
    userId: string, 
    limitKey: keyof typeof subscriptionPlans.$inferSelect, 
    usageKey: keyof typeof usageCounters.$inferSelect,
    incrementAmount: number = 1
  ): Promise<EntitlementResult> {
    const currentMonth = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
    
    // 1. Get Plan Limits
    let limit = 0;
    const activeSub = await this.getActiveSubscription(userId);
    if (activeSub) {
      const plan = await db.query.subscriptionPlans.findFirst({
        where: eq(subscriptionPlans.id, activeSub.planId!)
      });
      if (plan && typeof plan[limitKey] === 'number') {
        limit = plan[limitKey] as number;
      }
    } else {
      const freePlan = await db.query.subscriptionPlans.findFirst({
        where: eq(subscriptionPlans.slug, 'free')
      });
      if (freePlan && typeof freePlan[limitKey] === 'number') {
        limit = freePlan[limitKey] as number;
      }
    }

    if (limit === 0) { // Assuming 0 means unlimited or not allowed depending on business logic. Usually, 0 means unlimited if feature is enabled, but let's assume 0 means 0 here unless unlimited is specified differently. If 0 is unlimited, we return true. Wait, let's treat -1 as unlimited and 0 as none.
      // If limit is 0, they don't have access. Wait, in schema, default is 0. So 0 means none.
      return { allowed: false, reason: `No allowance for ${String(limitKey)}`, limit: 0, currentUsage: 0 };
    }

    // 2. Get Current Usage
    const usageRecord = await db.query.usageCounters.findFirst({
      where: and(eq(usageCounters.userId, userId), eq(usageCounters.month, currentMonth))
    });

    const currentUsage = usageRecord && typeof usageRecord[usageKey] === 'number' ? usageRecord[usageKey] as number : 0;

    if (currentUsage + incrementAmount > limit) {
      return { 
        allowed: false, 
        reason: `Exceeded monthly limit for ${String(limitKey)}`,
        currentUsage,
        limit 
      };
    }

    return { allowed: true, currentUsage, limit };
  }

  /**
   * Helper to get a valid, active subscription
   */
  private static async getActiveSubscription(userId: string) {
    // A subscription is considered usable if it is active, trialing, or in grace period
    const sub = await db.query.userSubscriptions.findFirst({
      where: eq(userSubscriptions.userId, userId),
      orderBy: (subscriptions, { desc }) => [desc(subscriptions.createdAt)]
    });

    if (!sub) return null;

    const validStates = ['active', 'trialing', 'grace_period', 'cancelled']; // 'cancelled' is still valid until expiresAt
    
    if (validStates.includes(sub.status)) {
      if (sub.expiresAt && new Date() > sub.expiresAt) {
        return null; // It has expired
      }
      return sub;
    }

    return null;
  }
}
