import { db } from './apps/web/db';
import { userAiCreditBalance, subscriptionPlans } from './apps/web/db/schema';
import { eq } from 'drizzle-orm';

async function run() {
  const activePlans = await db.select().from(subscriptionPlans);
  let freePlan = activePlans.find(p => p.slug === 'free');
  
  if (!freePlan) {
    console.log("No free plan found, inserting it.");
    await db.insert(subscriptionPlans).values({
      name: "Free",
      slug: "free",
      description: "Free plan",
      monthlyPrice: 0,
      yearlyPrice: 0,
      isActive: true,
      paddleProductId: "prd_free",
      paddleMonthlyPriceId: "pri_free_m",
      paddleYearlyPriceId: "pri_free_y",
      monthlyAiCredits: 500,
    });
    const updatedPlans = await db.select().from(subscriptionPlans);
    freePlan = updatedPlans.find(p => p.slug === 'free');
  }

  if (freePlan) {
    await db.update(userAiCreditBalance).set({ monthlyRemainingCredits: freePlan.monthlyAiCredits, purchasedRemainingCredits: 0 });
    console.log('Updated balances to', freePlan.monthlyAiCredits);
  }
  process.exit(0);
}
run();
