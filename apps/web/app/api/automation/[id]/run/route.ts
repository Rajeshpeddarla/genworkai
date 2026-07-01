import { NextResponse } from 'next/server';
import { requireUser } from '../../../../../lib/auth';
import { inngest } from '../../../../../inngest/client';
import { db } from '../../../../../db';
import { automationTasks } from '../../../../../db/schema';
import { eq, and } from 'drizzle-orm';
import { safeErrorResponse } from '../../../../../lib/errors';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, error } = await requireUser();
    if (error) return error;

    const { id } = await params;
    const taskId = parseInt(id);
    if (isNaN(taskId)) {
      return NextResponse.json({ error: 'Invalid Task ID' }, { status: 400 });
    }

    // Verify ownership
    const tasks = await db.select().from(automationTasks)
      .where(and(eq(automationTasks.id, taskId), eq(automationTasks.userId, user.id)))
      .limit(1);
    const task = tasks[0];

    if (!task) {
      return NextResponse.json({ error: 'Automation not found or unauthorized' }, { status: 404 });
    }

    // Trigger run
    await inngest.send({
      name: 'automation.task.run',
      data: { taskId }
    });

    return NextResponse.json({ success: true, message: 'Automation triggered successfully' });
  } catch (error: any) {
    console.error('RUN AUTOMATION ERROR:', error);
    if (error?.message?.includes('401')) {
      return NextResponse.json({ error: 'Inngest authentication failed. Check INNGEST_EVENT_KEY or run local dev server.' }, { status: 400 });
    }
    return safeErrorResponse(error, 'Run Automation Task Route');
  }
}
