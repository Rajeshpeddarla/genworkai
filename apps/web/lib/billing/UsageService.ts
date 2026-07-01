import { db } from '../../db';
import { 
  userAiCreditBalance, 
  userAiCreditPurchases,
  aiCreditCosts,
  aiUsageHistory,
  profiles,
  subscriptionPlans
} from '../../db/schema';
import { eq, asc, sql } from 'drizzle-orm';

export class UsageService {
  /**
   * Initializes or fetches the user's AI Credit balance.
   * If the monthlyResetAt is in a previous month, it resets the monthly quota.
   */
  static async getOrCreateBalance(userId: string) {
    let balance = await db.query.userAiCreditBalance.findFirst({
      where: eq(userAiCreditBalance.userId, userId)
    });

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let needsReset = false;
    
    if (!balance) {
      needsReset = true;
      balance = {
        id: 0,
        userId,
        monthlyRemainingCredits: 0,
        purchasedRemainingCredits: 0,
        monthlyResetAt: now,
        updatedAt: now
      };
    } else {
      const resetDate = new Date(balance.monthlyResetAt || 0);
      if (resetDate.getMonth() !== currentMonth || resetDate.getFullYear() !== currentYear) {
        needsReset = true;
      }
    }

    if (needsReset) {
      // Get their monthly plan limit
      const profile = await db.query.profiles.findFirst({ where: eq(profiles.id, userId) });
      const tier = profile?.tier || 'free';
      const plan = await db.query.subscriptionPlans.findFirst({ where: eq(subscriptionPlans.slug, tier) });
      
      const monthlyQuota = plan?.monthlyAiCredits ?? 0;

      if (!balance.id) {
        // Insert
        const [inserted] = await db.insert(userAiCreditBalance).values({
          userId,
          monthlyRemainingCredits: monthlyQuota,
          purchasedRemainingCredits: 0,
          monthlyResetAt: now,
          updatedAt: now
        }).returning();
        balance = inserted;
      } else {
        // Update
        const [updated] = await db.update(userAiCreditBalance)
          .set({
            monthlyRemainingCredits: monthlyQuota,
            monthlyResetAt: now,
            updatedAt: now
          })
          .where(eq(userAiCreditBalance.id, balance.id))
          .returning();
        balance = updated;
      }
    }

    return balance;
  }

  /**
   * Previews the cost of an operation based on its key in the DB.
   */
  static async previewConsumption(operationKey: string): Promise<number> {
    const costConfig = await db.query.aiCreditCosts.findFirst({
      where: eq(aiCreditCosts.operationKey, operationKey)
    });
    return costConfig?.credits ?? 0;
  }

  /**
   * Records AI usage and deducts from balances following FIFO logic.
   * Monthly Quota is consumed first, then purchased packs.
   * Authentication checks are NOT done here, this solely handles the billing.
   */
  static async consumeCredits(
    userId: string, 
    operationKey: string, 
    multiplier: number = 1,
    workspaceId?: number
  ): Promise<{ success: boolean; reason?: string; creditsUsed?: number }> {
    const start = Date.now();
    try {
      // 1. Determine cost
      const baseCost = await this.previewConsumption(operationKey);
      const totalCost = baseCost * multiplier;

      if (totalCost === 0) {
        // Free operation, just return success.
        return { success: true, creditsUsed: 0 };
      }

      const balance = await this.getOrCreateBalance(userId);

      if (!balance) {
        return { success: false, reason: "Could not retrieve user balance." };
      }

      // Special rule: Admin check happens in EntitlementEngine, 
      // but if an admin passes through here we still deduct if they have balance, 
      // or we can just bypass it. We assume EntitlementEngine handles unlimited checks.
      
      if (balance.monthlyRemainingCredits! + balance.purchasedRemainingCredits! < totalCost) {
        return { success: false, reason: "Insufficient AI Credits available." };
      }

      let remainingToConsume = totalCost;
      
      let consumeFromMonthly = 0;
      let consumeFromPurchased = 0;

      // 2. Consume from Monthly Quota first
      if (balance.monthlyRemainingCredits! > 0) {
        consumeFromMonthly = Math.min(balance.monthlyRemainingCredits!, remainingToConsume);
        balance.monthlyRemainingCredits! -= consumeFromMonthly;
        remainingToConsume -= consumeFromMonthly;
      }

      // 3. Consume from Purchased Quota if needed
      if (remainingToConsume > 0) {
        consumeFromPurchased = remainingToConsume;
        balance.purchasedRemainingCredits! -= consumeFromPurchased;

        // FIFO Deduction from individual packs
        const activePacks = await db.query.userAiCreditPurchases.findMany({
          where: eq(userAiCreditPurchases.userId, userId),
          orderBy: [asc(userAiCreditPurchases.purchasedAt)]
        });

        for (const pack of activePacks) {
          if (remainingToConsume <= 0) break;
          
          if (pack.remainingCredits > 0 && pack.status !== 'exhausted') {
            const consumeFromPack = Math.min(pack.remainingCredits, remainingToConsume);
            pack.remainingCredits -= consumeFromPack;
            remainingToConsume -= consumeFromPack;

            const newStatus = pack.remainingCredits <= 0 ? 'exhausted' : pack.status;

            await db.update(userAiCreditPurchases)
              .set({ 
                remainingCredits: sql`${userAiCreditPurchases.remainingCredits} - ${consumeFromPack}`,
                status: newStatus 
              })
              .where(eq(userAiCreditPurchases.id, pack.id));
          }
        }
      }

      // 4. Update the aggregate balance table atomically
      await db.update(userAiCreditBalance)
        .set({
          monthlyRemainingCredits: sql`GREATEST(0, ${userAiCreditBalance.monthlyRemainingCredits} - ${consumeFromMonthly})`,
          purchasedRemainingCredits: sql`GREATEST(0, ${userAiCreditBalance.purchasedRemainingCredits} - ${consumeFromPurchased})`,
          updatedAt: new Date()
        })
        .where(eq(userAiCreditBalance.id, balance.id));

      return { success: true, creditsUsed: totalCost };
    } catch (e) {
      console.error("UsageService Error:", e);
      return { success: false, reason: "Internal error recording usage" };
    }
  }

  /**
   * Adds purchased credits directly to a user's balance.
   */
  static async addPurchasedCredits(userId: string, amount: number) {
    const balance = await this.getOrCreateBalance(userId);
    if (!balance) throw new Error("Could not retrieve user balance.");
    
    await db.update(userAiCreditBalance)
      .set({
        purchasedRemainingCredits: (balance.purchasedRemainingCredits || 0) + amount,
        updatedAt: new Date()
      })
      .where(eq(userAiCreditBalance.id, balance.id));
  }
}
