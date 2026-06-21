import { db } from "@/db";
import { subscriptionPlans } from "@/db/schema";
import BillingClient from "./BillingClient";

export default async function BillingStudioPage() {
  const plans = await db.select().from(subscriptionPlans).orderBy(subscriptionPlans.monthlyPrice);

  return <BillingClient initialPlans={plans} />;
}
