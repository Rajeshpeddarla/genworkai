import { NextResponse } from 'next/server';
import { db } from '@/db';
import { automationTasks } from '@/db/schema';
import { requireUser } from '@/lib/auth';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    const { user, error } = await requireUser();
    if (error) return error;

    const tasks = await db.query.automationTasks.findMany({
      where: and(
        eq(automationTasks.userId, user.id),
        eq(automationTasks.category, 'database')
      ),
      orderBy: [desc(automationTasks.createdAt)]
    });

    return NextResponse.json({ tasks });
  } catch (error: any) {
    console.error('Fetch database automations error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { user, error } = await requireUser();
    if (error) return error;

    const body = await req.json();
    
    // Basic read-only SQL validation
    const sqlQuery = body.sqlQuery?.trim().toLowerCase();
    if (sqlQuery) {
      const dangerousKeywords = ['insert ', 'update ', 'delete ', 'drop ', 'alter ', 'truncate ', 'create '];
      if (dangerousKeywords.some(kw => sqlQuery.includes(kw))) {
        return NextResponse.json({ error: 'Only read-only queries (SELECT) are permitted for security.' }, { status: 400 });
      }
    }

    const [task] = await db.insert(automationTasks).values({
      userId: user.id,
      name: body.name || 'New Database Automation',
      description: body.description,
      category: 'database',
      executionMode: body.schedule === 'manual' ? 'manual' : 'scheduled',
      schedule: body.schedule,
      goal: body.goal, // System Prompt
      sqlQuery: body.sqlQuery,
      sources: body.sources,
      status: body.status || 'draft'
    }).returning();

    return NextResponse.json({ success: true, task });
  } catch (error: any) {
    console.error('Create database automation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
