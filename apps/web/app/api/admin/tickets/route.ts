import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tickets } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { user, error } = await requireAdmin();
    if (error) return error;

    const allTickets = await db.select().from(tickets).orderBy(desc(tickets.createdAt));
    return NextResponse.json(allTickets);
  } catch (error: any) {
    console.error('Failed to fetch tickets:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
