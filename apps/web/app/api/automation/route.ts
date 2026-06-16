import { NextResponse } from 'next/server';
import { db } from '../../../db';
import { automationTasks } from '../../../db/schema';
import { inngest } from '../../../inngest/client';
import { eq, desc } from 'drizzle-orm';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(req: Request) {
  try {
    const tasks = await db.select().from(automationTasks).orderBy(desc(automationTasks.createdAt));
    return NextResponse.json(tasks, { headers: corsHeaders });
  } catch (error: any) {
    console.error('Fetch tasks error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch tasks' }, { status: 500, headers: corsHeaders });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, category, goal, sourceId } = body;

    const newTask = await db.insert(automationTasks).values({
      name,
      type: category.toLowerCase(),
      goal,
      sourceId: sourceId ? parseInt(sourceId, 10) : null,
      isActive: true,
      // For MVP, if it has a schedule we could save it, otherwise trigger immediately
    }).returning();
    
    const taskId = newTask[0]!.id;

    // Trigger immediately via Inngest
    await inngest.send({
      name: 'automation.task.run',
      data: { taskId }
    });

    return NextResponse.json({ success: true, taskId }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('Create task error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create task' }, { status: 500, headers: corsHeaders });
  }
}
