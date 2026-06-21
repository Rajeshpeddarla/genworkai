"use server";

import { db } from "@/db";
import { promotionTemplates } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createPromotion(data: any) {
  await db.insert(promotionTemplates).values(data);
  revalidatePath('/admin/promotions');
}

export async function togglePromotion(id: number, isActive: boolean) {
  await db.update(promotionTemplates).set({ isActive }).where(eq(promotionTemplates.id, id));
  revalidatePath('/admin/promotions');
}
