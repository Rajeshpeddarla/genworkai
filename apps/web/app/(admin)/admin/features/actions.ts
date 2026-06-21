"use server";

import { db } from "@/db";
import { featureFlags } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function toggleFeatureFlag(id: number, isEnabled: boolean) {
  await db.update(featureFlags).set({ isEnabled }).where(eq(featureFlags.id, id));
  revalidatePath('/admin/features');
}
