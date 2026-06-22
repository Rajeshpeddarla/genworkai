import { db } from "@/db";
import { subscriptionPlans, userSubscriptions, billingEvents, profiles } from "@/db/schema";
import BillingClient from "./BillingClient";
import { eq, desc } from "drizzle-orm";
import { fetchPaddleData } from "./actions";

export default async function BillingStudioPage() {
  const plans = await db.select().from(subscriptionPlans).orderBy(subscriptionPlans.monthlyPrice);
  
  const subscriptions = await db.select({
    id: userSubscriptions.id,
    status: userSubscriptions.status,
    planId: userSubscriptions.planId,
    billingCycle: userSubscriptions.billingCycle,
    createdAt: userSubscriptions.createdAt,
    user: {
      id: profiles.id,
      fullName: profiles.fullName,
      email: profiles.email
    }
  }).from(userSubscriptions)
  .leftJoin(profiles, eq(userSubscriptions.userId, profiles.id))
  .orderBy(desc(userSubscriptions.createdAt))
  .limit(50);

  const events = await db.select().from(billingEvents).orderBy(desc(billingEvents.createdAt)).limit(50);

  const paddleData = await fetchPaddleData();

  const serializedPlans = JSON.parse(JSON.stringify(plans));
  const serializedSubscriptions = JSON.parse(JSON.stringify(subscriptions));
  const serializedEvents = JSON.parse(JSON.stringify(events));

  return <BillingClient 
    initialPlans={serializedPlans} 
    subscriptions={serializedSubscriptions} 
    events={serializedEvents} 
    paddleData={paddleData.success ? paddleData : null}
  />;
}
