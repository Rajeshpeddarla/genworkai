import { NextResponse } from 'next/server';
import { db } from '@/db';
import { 
  profiles, 
  userSubscriptions, 
  subscriptionPlans,
  knowledgeBases,
  connectedDatabases,
  automationTasks,
  aiCreditLedger,
  apiKeys
} from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth';
import { safeErrorResponse } from '@/lib/errors';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, error } = await requireAdmin();
    if (error) return error;

    const { id: targetUserId } = await params;

    // 1. Fetch Profile
    const profileRecord = await db.query.profiles.findFirst({
      where: eq(profiles.id, targetUserId)
    });

    if (!profileRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 2. Fetch Subscription Info
    const subRecord = await db.select({
      planName: subscriptionPlans.name,
      planSlug: subscriptionPlans.slug,
      billingCycle: userSubscriptions.billingCycle,
      currentPeriodEnd: userSubscriptions.renewsAt,
      status: userSubscriptions.status
    })
    .from(userSubscriptions)
    .leftJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
    .where(eq(userSubscriptions.userId, targetUserId))
    .limit(1);

    const subscription = subRecord[0] || null;

    // 3. Resource Counts
    const kbsCount = await db.select({ count: sql<number>`count(*)` }).from(knowledgeBases).where(eq(knowledgeBases.userId, targetUserId));
    const dbsCount = await db.select({ count: sql<number>`count(*)` }).from(connectedDatabases).where(eq(connectedDatabases.userId, targetUserId));
    const automationsCount = await db.select({ count: sql<number>`count(*)` }).from(automationTasks).where(eq(automationTasks.userId, targetUserId));
    const apiKeysCount = await db.select({ count: sql<number>`count(*)` }).from(apiKeys).where(eq(apiKeys.userId, targetUserId));

    // 4. AI Credit Metrics
    const creditStats = await db.select({
      totalConsumed: sql<number>`SUM(ABS(amount)) FILTER (WHERE amount < 0)`
    }).from(aiCreditLedger).where(eq(aiCreditLedger.userId, targetUserId));

    return NextResponse.json({
      profile: profileRecord,
      subscription: subscription,
      resources: {
        knowledgeBases: kbsCount[0]?.count || 0,
        databases: dbsCount[0]?.count || 0,
        automations: automationsCount[0]?.count || 0,
        apiKeys: apiKeysCount[0]?.count || 0
      },
      metrics: {
        totalAiCreditsConsumed: creditStats[0]?.totalConsumed || 0
      }
    });

  } catch (error: unknown) {
    return safeErrorResponse(error, 'Admin User Detail GET Route');
  }
}
