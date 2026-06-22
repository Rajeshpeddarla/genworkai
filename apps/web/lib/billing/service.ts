import { Paddle, Environment } from '@paddle/paddle-node-sdk';
import { db } from '../../db';
import { profiles, userSubscriptions, billingEvents, subscriptionPlans } from '../../db/schema';
import { eq } from 'drizzle-orm';

const paddle = new Paddle(process.env.PADDLE_API_KEY || '', {
  environment: Environment.production,
});

export class BillingService {
  /**
   * Generates a Paddle Customer Portal URL for the user to manage their subscription
   */
  static async getCustomerPortal(userId: string): Promise<string | null> {
    const user = await db.query.profiles.findFirst({
      where: eq(profiles.id, userId),
      columns: { paddleCustomerId: true },
    });

    if (!user?.paddleCustomerId) return null;

    try {
      // Paddle currently does not have an API to generate portal sessions via SDK
      // Instead, we just return a self-serve portal URL pattern or rely on Paddle.js on frontend.
      return `https://paddle.com/portal/customer/${user.paddleCustomerId}`; 
    } catch (error) {
      console.error('Failed to get customer portal', error);
      return null;
    }
  }

  /**
   * Upgrades or Downgrades a user's subscription
   */
  static async updateSubscription(paddleSubscriptionId: string, newPriceId: string) {
    try {
      await paddle.subscriptions.update(paddleSubscriptionId, {
        items: [{ priceId: newPriceId, quantity: 1 }],
        prorationBillingMode: 'prorated_immediately',
      });
      return true;
    } catch (error) {
      console.error('Failed to update subscription', error);
      return false;
    }
  }

  /**
   * Cancels a user's subscription at the end of their billing period
   */
  static async cancelSubscription(paddleSubscriptionId: string) {
    try {
      await paddle.subscriptions.cancel(paddleSubscriptionId, {
        effectiveFrom: 'next_billing_period',
      });
      return true;
    } catch (error) {
      console.error('Failed to cancel subscription', error);
      return false;
    }
  }
}
