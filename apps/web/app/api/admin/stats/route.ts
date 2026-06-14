import { NextResponse } from 'next/server';
import { db } from '@/db';
import { profiles, knowledgeBases, workspaceArtifacts, documents } from '@/db/schema';
import { count, eq, sum } from 'drizzle-orm';
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

    // Aggregate stats
    const totalUsersReq = db.select({ value: count() }).from(profiles);
    const totalKbsReq = db.select({ value: count() }).from(knowledgeBases);
    const totalContextReq = db.select({ value: sum(documents.sizeBytes) }).from(documents);
    const totalArtifactsReq = db.select({ value: count() }).from(workspaceArtifacts);

    const [totalUsers, totalKbs, totalContext, totalArtifacts] = await Promise.all([
      totalUsersReq, totalKbsReq, totalContextReq, totalArtifactsReq
    ]);

    // Subscriptions split
    const proUsers = await db.select({ value: count() }).from(profiles).where(eq(profiles.tier, 'pro'));
    const freeUsers = await db.select({ value: count() }).from(profiles).where(eq(profiles.tier, 'free'));

    return NextResponse.json({
      totalUsers: totalUsers[0]?.value ?? 0,
      totalKbs: totalKbs[0]?.value ?? 0,
      totalContextBytes: parseInt((totalContext[0]?.value as string) || "0", 10),
      totalArtifacts: totalArtifacts[0]?.value ?? 0,
      subscriptions: {
        pro: proUsers[0]?.value ?? 0,
        free: freeUsers[0]?.value ?? 0
      }
    });
  } catch (error: any) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
