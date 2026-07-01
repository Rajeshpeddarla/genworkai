import { NextResponse } from 'next/server';
import { db } from '@/db';
import { aiCreditCosts } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const key = url.searchParams.get('key');
    
    if (key) {
      const costs = await db.select().from(aiCreditCosts).where(eq(aiCreditCosts.operationKey, key));
      
      if (costs.length === 0) {
        return NextResponse.json({ cost: null }, { status: 404 });
      }
      return NextResponse.json({ cost: costs[0]!.credits });
    } else {
      const allCosts = await db.select().from(aiCreditCosts);
      return NextResponse.json({ costs: allCosts });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch costs' }, { status: 500 });
  }
}
