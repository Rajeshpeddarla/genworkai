// @ts-nocheck
import { inngest } from "../client";
import { db } from "@/db";
import { profiles, aiCreditLedger, userAiCreditBalance, subscriptionPlans, userSubscriptions } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export const cronMonthlyRefill: any = inngest.createFunction(
  { id: "cron-monthly-refill", triggers: [{ cron: "0 0 1 * *" }] }, // Run at midnight on the first of every month
  async ({ event, step }) => {
    
    const usersToRefill = await step.run("fetch-users", async () => {
      // Join profiles with userSubscriptions and subscriptionPlans to get exact quotas
      const allProfiles = await db.select({
        id: profiles.id,
        isAdmin: profiles.isAdmin,
        monthlyQuota: subscriptionPlans.monthlyAiCredits,
        tier: subscriptionPlans.slug
      })
      .from(profiles)
      .leftJoin(userSubscriptions, eq(profiles.id, userSubscriptions.userId))
      .leftJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id));
      
      return allProfiles;
    });

    await step.run("process-monthly-refills", async () => {
      for (const user of usersToRefill) {
        let refillAmount = user.monthlyQuota ?? 50; // Default to 50 if no plan found (Free)
        
        if (user.isAdmin) {
          refillAmount = 100000; // Generous for admins
        }

        // We use a transaction to safely update the balance and insert into the ledger
        await db.transaction(async (tx) => {
          // Check if balance record exists
          const existing = await tx.select().from(userAiCreditBalance).where(eq(userAiCreditBalance.userId, user.id));
          
          if (existing.length === 0) {
            await tx.insert(userAiCreditBalance).values({
              userId: user.id,
              monthlyRemainingCredits: refillAmount,
              purchasedRemainingCredits: 0,
              monthlyResetAt: new Date(),
              updatedAt: new Date()
            });
          } else {
            // STRICTLY RESET monthlyRemainingCredits. Do NOT touch purchasedRemainingCredits. Do NOT rollover.
            await tx.update(userAiCreditBalance)
              .set({ 
                monthlyRemainingCredits: refillAmount,
                monthlyResetAt: new Date(),
                updatedAt: new Date()
              })
              .where(eq(userAiCreditBalance.userId, user.id));
          }

          // Insert Ledger record
          await tx.insert(aiCreditLedger).values({
            userId: user.id,
            amount: refillAmount,
            type: 'refill', // mapped to refill
            operationKey: 'monthly_reset',
            description: `Monthly quota reset to ${refillAmount} (${user.tier || 'free'} tier)`,
            idempotencyKey: `monthly_refill_${user.id}_${new Date().toISOString().slice(0, 7)}`,
          });
        });
      }
    });

    return { success: true, refilledUsers: usersToRefill.length };
  }
);
