"use server";

import { db } from "@/db";
import { subscriptionPlans } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { Environment, Paddle } from '@paddle/paddle-node-sdk';

const paddle = new Paddle(process.env.PADDLE_API_KEY || '', {
  environment: process.env.PADDLE_API_KEY?.startsWith('pdl_live') ? Environment.production : Environment.sandbox,
});

export async function updatePlan(id: number, data: any) {
  await db.update(subscriptionPlans).set(data).where(eq(subscriptionPlans.id, id));
  revalidatePath('/admin/billing');
}

export async function createPlan(data: any) {
  await db.insert(subscriptionPlans).values(data);
  revalidatePath('/admin/billing');
}

export async function fetchPaddleData() {
  try {
    // 1. Fetch Products
    const productsIterator = paddle.products.list();
    const products = [];
    for await (const prod of productsIterator) {
      products.push(prod);
    }

    // 2. Fetch Prices
    const pricesIterator = paddle.prices.list();
    const prices = [];
    for await (const price of pricesIterator) {
      prices.push(price);
    }

    // 3. Fetch Webhooks (Event Types & Endpoints)
    const webhooks = await paddle.notificationSettings.list();

    // 4. Fetch Subscriptions
    const subscriptionsIterator = paddle.subscriptions.list();
    const subscriptions = [];
    for await (const sub of subscriptionsIterator) {
      subscriptions.push(sub);
    }

    const payload = { products, prices, webhooks, subscriptions, success: true };
    return JSON.parse(JSON.stringify(payload));
  } catch (err: any) {
    console.error("Error fetching Paddle data:", err);
    return { success: false, error: err.message };
  }
}

export async function cancelSubscription(subscriptionId: string) {
  try {
    const updatedSub = await paddle.subscriptions.cancel(subscriptionId, {
      effectiveFrom: 'immediately'
    });
    revalidatePath('/admin/billing');
    return { success: true, subscription: updatedSub };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function pauseSubscription(subscriptionId: string) {
  try {
    const updatedSub = await paddle.subscriptions.pause(subscriptionId, {
      effectiveFrom: 'immediately'
    });
    revalidatePath('/admin/billing');
    return { success: true, subscription: updatedSub };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function resumeSubscription(subscriptionId: string) {
  try {
    const updatedSub = await paddle.subscriptions.resume(subscriptionId, {
      effectiveFrom: 'immediately'
    });
    revalidatePath('/admin/billing');
    return { success: true, subscription: updatedSub };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function syncWithPaddle() {
  const result = await fetchPaddleData();
  if (result.success) {
    // Basic local DB sync could be implemented here, e.g. mapping paddle_product_id
  }
  revalidatePath('/admin/billing');
  return result;
}
