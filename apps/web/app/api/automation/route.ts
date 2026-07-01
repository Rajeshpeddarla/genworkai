import { NextResponse } from 'next/server';
import { db } from '../../../db';
import { automationTasks } from '../../../db/schema';
import { inngest } from '../../../inngest/client';
import { eq, desc } from 'drizzle-orm';
import { requireUser } from '../../../lib/auth';
import { safeErrorResponse, ValidationError } from '../../../lib/errors';
import { EntitlementEngine } from '../../../lib/billing/entitlements';

export async function GET(req: Request) {
  try {
    const { user, error } = await requireUser();
    if (error) return error;

    const tasks = await db.select().from(automationTasks).where(eq(automationTasks.userId, user.id)).orderBy(desc(automationTasks.createdAt));
    return NextResponse.json(tasks);
  } catch (error: unknown) {
    return safeErrorResponse(error, 'Fetch Automation Tasks Route');
  }
}

export async function POST(req: Request) {
  try {
    const { user, error } = await requireUser();
    if (error) return error;

    const featureCheck = await EntitlementEngine.hasFeature(user.id, 'automation_access');
    if (!featureCheck.allowed) {
      throw new ValidationError(featureCheck.reason || 'Automation Studio is disabled on your plan.');
    }

    const limitCheck = await EntitlementEngine.checkLimit({ userId: user.id, resource: 'automations' });
    if (!limitCheck.allowed) {
      throw new ValidationError(`Limit reached. You can only create up to ${limitCheck.limit} Automations on your plan. Upgrade for more.`);
    }

    const body = await req.json();
    const { name, description, category, templateId, sources, artifactTypes, executionMode, schedule, triggerEvent, goal, sqlQuery, aiProvider, billingMode } = body;

    if (!name || !category) {
      throw new ValidationError('Name and Category are required');
    }

    const newTask = await db.insert(automationTasks).values({
      userId: user.id,
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
      sqlQuery,
      aiProvider,
      billingMode,
      status: 'active',
    }).returning();
    
    const taskId = newTask[0]!.id;

    // If it's a manual task, or we want to run immediately:
    if (executionMode === 'manual') {
      try {
        await inngest.send({
          name: 'automation.task.run',
          data: { taskId }
        });
      } catch (e) {
        console.warn('Failed to trigger inngest task automatically (is the dev server running?):', e);
      }
    }

    return NextResponse.json({ success: true, taskId });
  } catch (error: any) {
    console.error("Automation Save Error:", error?.message || error);
    return safeErrorResponse(error, 'Create Automation Task Route');
  }
}
