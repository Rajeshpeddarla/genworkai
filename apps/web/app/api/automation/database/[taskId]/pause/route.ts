import { NextResponse } from 'next/server';
import { db } from '@/db';
import { automationTasks } from '@/db/schema';
import { requireUser } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';

export async function POST(req: Request, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    const { user, error } = await requireUser();
    if (error) return error;

    const { taskId } = await params;
    const body = await req.json();
    const newStatus = body.status;

    if (!newStatus || !['active', 'paused'].includes(newStatus)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    
    // Ensure task belongs to user
    const task = await db.query.automationTasks.findFirst({
      where: and(eq(automationTasks.id, parseInt(taskId)), eq(automationTasks.userId, user.id))
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found or unauthorized' }, { status: 404 });
    }

    await db.update(automationTasks)
      .set({ status: newStatus })
      .where(eq(automationTasks.id, parseInt(taskId)));

    return NextResponse.json({ success: true, status: newStatus });
  } catch (error: any) {
    console.error('Toggle automation status error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
