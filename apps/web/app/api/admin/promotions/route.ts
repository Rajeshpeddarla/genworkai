import { NextResponse } from 'next/server';
import { db } from '@/db';
import { promotions, profiles } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const adminCheck = await db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1);
    if (!adminCheck[0]?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const data = await db.select().from(promotions).orderBy(desc(promotions.createdAt));
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const adminCheck = await db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1);
    if (!adminCheck[0]?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const newPromo = await db.insert(promotions).values(body).returning();
    
    return NextResponse.json(newPromo[0]);
  } catch (error: any) {
    console.error("Promotion save error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
