import { NextResponse } from 'next/server';
import { db } from '@/db';
import { automationTasks, automationLogs, workspaceArtifacts, workspaceArtifactVersions } from '@/db/schema';
import { requireUser } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';

export async function DELETE(req: Request, { params }: { params: Promise<{ taskId: string, logId: string }> }) {
  try {
    const { user, error } = await requireUser();
    if (error) return error;

    const { taskId, logId } = await params;
    
    // Ensure task belongs to user
    const task = await db.query.automationTasks.findFirst({
      where: and(eq(automationTasks.id, parseInt(taskId)), eq(automationTasks.userId, user.id))
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found or unauthorized' }, { status: 404 });
    }

    // Find the log
    const log = await db.query.automationLogs.findFirst({
      where: and(eq(automationLogs.id, parseInt(logId)), eq(automationLogs.taskId, parseInt(taskId)))
    });

    if (!log) {
      return NextResponse.json({ error: 'Log not found' }, { status: 404 });
    }

    // Delete associated artifact if it exists
    if (log.artifactId) {
      await db.delete(workspaceArtifactVersions).where(eq(workspaceArtifactVersions.artifactId, log.artifactId));
      await db.delete(workspaceArtifacts).where(eq(workspaceArtifacts.id, log.artifactId));
    }

    // Delete log
    await db.delete(automationLogs).where(eq(automationLogs.id, parseInt(logId)));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete automation history error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
