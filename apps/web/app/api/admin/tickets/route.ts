import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tickets } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { createApiClient } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createApiClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const allTickets = await db.select().from(tickets).orderBy(desc(tickets.createdAt));
    return NextResponse.json(allTickets);
  } catch (error: any) {
    console.error('Failed to fetch tickets:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
