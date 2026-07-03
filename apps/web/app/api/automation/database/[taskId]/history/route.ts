import { NextResponse } from 'next/server';
import { db } from '@/db';
import { automationTasks, automationLogs, workspaceArtifacts, workspaceArtifactVersions } from '@/db/schema';
import { requireUser } from '@/lib/auth';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(req: Request, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    const { user, error } = await requireUser();
    if (error) return error;

    const { taskId } = await params;
    
    // Ensure task belongs to user
    const task = await db.query.automationTasks.findFirst({
      where: and(eq(automationTasks.id, parseInt(taskId)), eq(automationTasks.userId, user.id))
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found or unauthorized' }, { status: 404 });
    }

    // Fetch history logs
    const history = await db.select({
      id: automationLogs.id,
      taskId: automationLogs.taskId,
      status: automationLogs.status,
      logs: automationLogs.logs,
      artifactId: automationLogs.artifactId,
      startedAt: automationLogs.startedAt,
      finishedAt: automationLogs.finishedAt,
      durationMs: automationLogs.durationMs,
      errorDetails: automationLogs.errorDetails,
      artifactTitle: workspaceArtifacts.name,
      artifactFileType: workspaceArtifacts.fileType
    })
    .from(automationLogs)
    .leftJoin(workspaceArtifacts, eq(automationLogs.artifactId, workspaceArtifacts.id))
    .where(eq(automationLogs.taskId, parseInt(taskId)))
    .orderBy(desc(automationLogs.startedAt))
    .limit(50);

    // Collect artifact IDs to fetch versions
    const artifactIds = history.map(h => h.artifactId).filter(id => id !== null) as number[];
    let versionsMap: Record<number, any> = {};

    if (artifactIds.length > 0) {
      // Drizzle ORM doesn't easily support DISTINCT ON or latest version joins cleanly without raw SQL,
      // so we fetch all versions for these artifacts and pick the latest in memory.
      const allVersions = await db.select().from(workspaceArtifactVersions);
      
      for (const row of allVersions) {
        if (artifactIds.includes(row.artifactId as number)) {
          const existing = versionsMap[row.artifactId as number];
          if (!existing || (row.versionNumber as number) > existing.versionNumber) {
            versionsMap[row.artifactId as number] = row;
          }
        }
      }
    }

    const enhancedHistory = history.map(h => ({
      ...h,
      artifactContent: h.artifactId ? versionsMap[h.artifactId]?.content : undefined,
      artifactVersion: h.artifactId ? versionsMap[h.artifactId]?.versionNumber : undefined
    }));

    return NextResponse.json({ history: enhancedHistory });
  } catch (error: any) {
    console.error('Fetch automation history error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
