"use server";

import { db } from "@/db";
import { promotionTemplates } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { Paddle, Environment } from "@paddle/paddle-node-sdk";

const paddle = new Paddle(process.env.PADDLE_API_KEY || '', {
  environment: Environment.production, 
});

export async function createPromotion(data: any) {
  let finalPaddleId = data.paddleDiscountId;
  
  if (!finalPaddleId && data.type === 'discount' && data.value?.discountPercent) {
    try {
      const discount = await paddle.discounts.create({
        amount: data.value.discountPercent.toString(),
        description: data.description || data.code,
        type: 'percentage',
        code: data.code,
        enabledForCheckout: true,
      });
      finalPaddleId = discount.id;
    } catch (e) {
      console.error("Failed to create Paddle discount", e);
    }
  }

  await db.insert(promotionTemplates).values({
    ...data,
    paddleDiscountId: finalPaddleId,
  });
  revalidatePath('/admin/promotions');
}

export async function togglePromotion(id: number, isActive: boolean) {
  await db.update(promotionTemplates).set({ isActive }).where(eq(promotionTemplates.id, id));
  revalidatePath('/admin/promotions');
}
