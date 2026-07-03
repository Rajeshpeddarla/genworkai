import { NextResponse } from 'next/server';
import { db } from '@/db';
import { automationTasks } from '@/db/schema';
import { requireUser } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';

export async function PUT(req: Request, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    const { user, error } = await requireUser();
    if (error) return error;

    const { taskId } = await params;
    const body = await req.json();

    // Basic read-only SQL validation
    const sqlQuery = body.sqlQuery?.trim().toLowerCase();
    if (sqlQuery) {
      const dangerousKeywords = ['insert ', 'update ', 'delete ', 'drop ', 'alter ', 'truncate ', 'create '];
      if (dangerousKeywords.some(kw => sqlQuery.includes(kw))) {
        return NextResponse.json({ error: 'Only read-only queries (SELECT) are permitted for security.' }, { status: 400 });
      }
    }

    const [updatedTask] = await db.update(automationTasks)
      .set({
        name: body.name,
        description: body.description,
        schedule: body.schedule,
        executionMode: body.schedule === 'manual' ? 'manual' : 'scheduled',
        goal: body.goal,
        sqlQuery: body.sqlQuery,
        sources: body.sources,
        status: body.status,
        updatedAt: new Date()
      })
      .where(and(eq(automationTasks.id, parseInt(taskId)), eq(automationTasks.userId, user.id)))
      .returning();

    if (!updatedTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, task: updatedTask });
  } catch (error: any) {
    console.error('Update database automation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    const { user, error } = await requireUser();
    if (error) return error;

    const { taskId } = await params;

    const [deletedTask] = await db.delete(automationTasks)
      .where(and(eq(automationTasks.id, parseInt(taskId)), eq(automationTasks.userId, user.id)))
      .returning();

    if (!deletedTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete database automation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
