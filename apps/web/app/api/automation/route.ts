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
    const { name, description, category, templateId, sources, artifactTypes, executionMode, schedule, triggerEvent, goal } = body;

    const newTask = await db.insert(automationTasks).values({
      name,
      description,
      category,
      templateId,
      sources,
      artifactTypes,
      executionMode: executionMode || 'manual',
      schedule,
      triggerEvent,
      goal,
      status: 'active',
    }).returning();
    
    const taskId = newTask[0]!.id;

    // If it's a manual task, or we want to run immediately:
    if (executionMode === 'manual') {
      await inngest.send({
        name: 'automation.task.run',
        data: { taskId }
      });
    }

    return NextResponse.json({ success: true, taskId }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('Create task error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create task' }, { status: 500, headers: corsHeaders });
  }
}
