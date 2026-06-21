"use server";

import { db } from "@/db";
import { subscriptionPlans } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updatePlan(id: number, data: any) {
  await db.update(subscriptionPlans).set(data).where(eq(subscriptionPlans.id, id));
  revalidatePath('/admin/billing');
}

export async function createPlan(data: any) {
  await db.insert(subscriptionPlans).values(data);
  revalidatePath('/admin/billing');
}
