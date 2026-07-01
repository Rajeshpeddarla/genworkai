import { NextResponse } from 'next/server';
import { db } from '@/db';
import { aiCreditLedger } from '@/db/schema';
import { requireUser } from '@/lib/auth';
import { eq, desc } from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    const { user, error } = await requireUser();
    if (error) return error;

    // Fetch the 50 most recent ledger entries for the user
    const history = await db.select()
      .from(aiCreditLedger)
      .where(eq(aiCreditLedger.userId, user.id))
      .orderBy(desc(aiCreditLedger.createdAt))
      .limit(50);

    return NextResponse.json({ success: true, history });
  } catch (error: any) {
    console.error("Failed to fetch credit history:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
