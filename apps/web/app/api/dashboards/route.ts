import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { dashboards } from '@/db/schema';
import { requireUser } from '@/lib/auth';
import { eq, desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const { user, error } = await requireUser();
    if (error) return error;

    const userDashboards = await db.select().from(dashboards).where(eq(dashboards.userId, user.id)).orderBy(desc(dashboards.createdAt));

    return NextResponse.json(userDashboards);
  } catch (error: any) {
    console.error('Error fetching dashboards:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, error } = await requireUser();
    if (error) return error;

    const { name, description, dataSourceId, icon, coverColor, isTemplate } = await req.json();

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const [newDashboard] = await db
      .insert(dashboards)
      .values({
        userId: user.id,
        name,
        description,
        dataSourceId,
        icon,
        coverColor,
        isTemplate: isTemplate || false,
      })
      .returning();

    return NextResponse.json(newDashboard);
  } catch (error: any) {
    console.error('Error creating dashboard:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
