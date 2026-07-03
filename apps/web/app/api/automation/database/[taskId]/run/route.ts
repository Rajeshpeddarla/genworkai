import { NextResponse } from 'next/server';
import { db } from '@/db';
import { automationTasks } from '@/db/schema';
import { requireUser } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { inngest } from '@/inngest/client';

export async function POST(req: Request, { params }: { params: Promise<{ taskId: string }> }) {
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

    // Trigger Inngest function
    await inngest.send({
      name: 'automation.database.run',
      data: { taskId: task.id }
    });

    return NextResponse.json({ success: true, message: 'Execution triggered successfully' });
  } catch (error: any) {
    console.error('Run automation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
