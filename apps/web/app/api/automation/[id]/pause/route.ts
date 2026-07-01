import { NextResponse } from 'next/server';
import { requireUser } from '../../../../../lib/auth';
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

    const body = await req.json();
    const newStatus = body.status === 'paused' ? 'paused' : 'active';

    // Verify ownership and update
    const result = await db.update(automationTasks)
      .set({ status: newStatus })
      .where(and(eq(automationTasks.id, taskId), eq(automationTasks.userId, user.id)))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: 'Automation not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true, status: newStatus });
  } catch (error: unknown) {
    return safeErrorResponse(error, 'Toggle Automation Status Route');
  }
}
