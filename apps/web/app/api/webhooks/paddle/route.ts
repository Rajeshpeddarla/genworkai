import { NextResponse } from 'next/server';
import { Environment, Paddle } from '@paddle/paddle-node-sdk';
import { db } from '@/db';
import { profiles, userSubscriptions, billingEvents, subscriptionPlans } from '@/db/schema';
import { eq } from 'drizzle-orm';

const paddle = new Paddle(process.env.PADDLE_API_KEY || '', {
  environment: process.env.PADDLE_API_KEY?.startsWith('pdl_live') ? Environment.production : Environment.sandbox,
});

export async function POST(req: Request) {
  const signature = req.headers.get('paddle-signature');
  const secret = process.env.PADDLE_WEBHOOK_SECRET;

  if (!secret || !signature) {
    console.error('Paddle Webhook secret or signature is missing');
    return NextResponse.json({ error: 'Webhook secret or signature missing' }, { status: 400 });
  }

  try {
    const rawBody = await req.text();
    
    // Verify signature using Paddle SDK
    const eventData = await paddle.webhooks.unmarshal(rawBody, secret, signature);

    if (eventData) {
      console.log(`Received valid Paddle event: ${eventData.eventType}`);
      
      switch (eventData.eventType) {
        case 'subscription.created':
        case 'subscription.updated': {
          const subscription = eventData.data as any; // Type coercion for brevity
          
          // Find the internal plan matching this price
          const priceId = subscription.items[0]?.price?.id;
          if (!priceId) break;
          
          let planId = null;
          let billingCycle = 'monthly';
          
          const matchingPlan = await db.query.subscriptionPlans.findFirst({
            where: (plans: any, { or, eq }: any) => or(
              eq(plans.paddleMonthlyPriceId, priceId),
              eq(plans.paddleYearlyPriceId, priceId)
            )
          });
          
          if (matchingPlan) {
            planId = matchingPlan.id;
            billingCycle = matchingPlan.paddleYearlyPriceId === priceId ? 'yearly' : 'monthly';
          }
          
          // Update profile
          const userProfile = await db.query.profiles.findFirst({
            where: eq(profiles.paddleCustomerId, subscription.customerId)
          });
          
          if (!userProfile) {
            console.error(`User profile not found for paddle customer ${subscription.customerId}`);
            break;
          }
          
          await db.update(profiles).set({
            paddleSubscriptionId: subscription.id,
            paddleSubscriptionStatus: subscription.status,
          }).where(eq(profiles.id, userProfile.id));

          // Upsert user_subscriptions
          const existingSub = await db.query.userSubscriptions.findFirst({
            where: eq(userSubscriptions.paddleSubscriptionId, subscription.id)
          });

          if (existingSub) {
            await db.update(userSubscriptions).set({
              planId,
              status: subscription.status,
              billingCycle,
              renewsAt: subscription.nextBilledAt ? new Date(subscription.nextBilledAt) : null,
              expiresAt: subscription.canceledAt ? new Date(subscription.canceledAt) : null,
              updatedAt: new Date()
            }).where(eq(userSubscriptions.id, existingSub.id));
          } else {
            await db.insert(userSubscriptions).values({
              userId: userProfile.id,
              planId,
              status: subscription.status,
              billingCycle,
              paddleCustomerId: subscription.customerId,
              paddleSubscriptionId: subscription.id,
              startedAt: new Date(subscription.startedAt),
              renewsAt: subscription.nextBilledAt ? new Date(subscription.nextBilledAt) : null,
              expiresAt: subscription.canceledAt ? new Date(subscription.canceledAt) : null,
            });
          }
          break;
        }
        case 'subscription.canceled': {
          const subscription = eventData.data as any;
          await db.update(userSubscriptions).set({
            status: 'cancelled',
            expiresAt: subscription.canceledAt ? new Date(subscription.canceledAt) : new Date(),
            updatedAt: new Date()
          }).where(eq(userSubscriptions.paddleSubscriptionId, subscription.id));
          
          await db.update(profiles).set({
            paddleSubscriptionStatus: 'cancelled'
          }).where(eq(profiles.paddleSubscriptionId, subscription.id));
          break;
        }
        case 'transaction.completed': {
          const transaction = eventData.data as any;
          
          const userProfile = await db.query.profiles.findFirst({
            where: eq(profiles.paddleCustomerId, transaction.customerId)
          });
          
          if (userProfile) {
            await db.insert(billingEvents).values({
              userId: userProfile.id,
              amount: parseInt(transaction.details?.totals?.total || '0'),
              currency: transaction.currencyCode || 'USD',
              eventType: 'payment_success',
              paddleTransactionId: transaction.id,
              metadata: { origin: transaction.origin }
            });
          }
          break;
        }
        case 'transaction.payment_failed' as any:
        case 'transaction.past_due': {
          const transaction = eventData.data as any;
          
          const userProfile = await db.query.profiles.findFirst({
            where: eq(profiles.paddleCustomerId, transaction.customerId)
          });
          
          if (userProfile) {
            await db.insert(billingEvents).values({
              userId: userProfile.id,
              amount: parseInt(transaction.details?.totals?.total || '0'),
              currency: transaction.currencyCode || 'USD',
              eventType: 'payment_failed',
              paddleTransactionId: transaction.id,
              metadata: { origin: transaction.origin }
            });
            
            // Mark subscription as past_due if related
            if (transaction.subscriptionId) {
              await db.update(userSubscriptions).set({
                status: 'past_due',
                updatedAt: new Date()
              }).where(eq(userSubscriptions.paddleSubscriptionId, transaction.subscriptionId));
            }
          }
          break;
        }
        default:
          console.log(`Unhandled event type ${eventData.eventType}`);
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({ error: 'Webhook verification failed' }, { status: 400 });
  }
}
