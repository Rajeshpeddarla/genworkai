import { NextResponse } from 'next/server';
import { db } from '@/db';
import { promotions, profiles } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth';
import { safeErrorResponse } from '@/lib/errors';

export async function GET(req: Request) {
  try {
    const { user, error } = await requireAdmin();
    if (error) return error;

    const data = await db.select().from(promotions).orderBy(desc(promotions.createdAt));
    return NextResponse.json(data);
  } catch (error: unknown) {
    return safeErrorResponse(error, 'Admin Promotions GET Route');
  }
}

export async function POST(req: Request) {
  try {
    const { user, error } = await requireAdmin();
    if (error) return error;

    const body = await req.json();
    const newPromo = await db.insert(promotions).values(body).returning();
    
    return NextResponse.json(newPromo[0]);
  } catch (error: unknown) {
    return safeErrorResponse(error, 'Admin Promotions POST Route');
  }
}
