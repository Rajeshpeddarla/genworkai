import { NextResponse } from 'next/server';
import { db } from '@/db';
import { automationTasks, automationLogs } from '@/db/schema';
import { requireUser } from '@/lib/auth';
import { eq, and, sql, gte } from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    const { user, error } = await requireUser();
    if (error) return error;

    const tasksQuery = await db.select({
      status: automationTasks.status,
      count: sql<number>`count(*)`,
      averageRuntime: sql<number>`avg(${automationTasks.averageRuntimeMs})`,
      totalRuns: sql<number>`sum(${automationTasks.totalRuns})`
    })
    .from(automationTasks)
    .where(and(
      eq(automationTasks.userId, user.id),
      eq(automationTasks.category, 'database')
    ))
    .groupBy(automationTasks.status);

    let total = 0;
    let active = 0;
    let running = 0;
    let failed = 0;
    let paused = 0;
    let avgRuntimeTotal = 0;
    let numRuntimeTasks = 0;
    let totalExecutions = 0;

    tasksQuery.forEach(t => {
      const c = Number(t.count);
      total += c;
      if (t.status === 'active') active += c;
      if (t.status === 'running') running += c;
      if (t.status === 'failed') failed += c;
      if (t.status === 'paused') paused += c;
      
      if (t.averageRuntime && Number(t.averageRuntime) > 0) {
        avgRuntimeTotal += Number(t.averageRuntime);
        numRuntimeTasks++;
      }
      
      if (t.totalRuns) {
        totalExecutions += Number(t.totalRuns);
      }
    });

    const averageExecutionTimeMs = numRuntimeTasks > 0 ? Math.round(avgRuntimeTotal / numRuntimeTasks) : 0;

    // Today's runs
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const logsQuery = await db.select({ count: sql<number>`count(*)` })
      .from(automationLogs)
      .innerJoin(automationTasks, eq(automationLogs.taskId, automationTasks.id))
      .where(and(
        eq(automationTasks.userId, user.id),
        gte(automationLogs.startedAt, startOfToday)
      ));

    const todaysRuns = Number(logsQuery[0]?.count || 0);

    return NextResponse.json({
      success: true,
      stats: {
        total,
        active,
        running,
        failed,
        paused,
        totalExecutions,
        averageExecutionTimeMs
      }
    });
  } catch (error: any) {
    console.error('Fetch automation stats error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
