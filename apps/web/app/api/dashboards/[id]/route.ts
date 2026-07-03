import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { dashboards, dashboardWidgets } from '@/db/schema';
import { requireUser } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, error } = await requireUser();
    if (error) return error;

    const resolvedParams = await params;
    const dashboardId = parseInt(resolvedParams.id, 10);
    if (isNaN(dashboardId)) {
      return NextResponse.json({ error: 'Invalid dashboard ID' }, { status: 400 });
    }

    const dashboard = await db.query.dashboards.findFirst({
      where: and(eq(dashboards.id, dashboardId), eq(dashboards.userId, user.id)),
    });

    if (!dashboard) {
      return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 });
    }

    const widgets = await db.select().from(dashboardWidgets).where(eq(dashboardWidgets.dashboardId, dashboard.id));

    return NextResponse.json({ ...dashboard, widgets });
  } catch (error: any) {
    console.error('Error fetching dashboard:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, error } = await requireUser();
    if (error) return error;

    const resolvedParams = await params;
    const dashboardId = parseInt(resolvedParams.id, 10);
    if (isNaN(dashboardId)) {
      return NextResponse.json({ error: 'Invalid dashboard ID' }, { status: 400 });
    }

    const body = await req.json();
    
    // Ensure dashboard belongs to user
    const existing = await db.query.dashboards.findFirst({
      where: and(eq(dashboards.id, dashboardId), eq(dashboards.userId, user.id)),
    });

    if (!existing) {
      return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 });
    }

    const [updatedDashboard] = await db
      .update(dashboards)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(dashboards.id, dashboardId))
      .returning();

    return NextResponse.json(updatedDashboard);
  } catch (error: any) {
    console.error('Error updating dashboard:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, error } = await requireUser();
    if (error) return error;

    const resolvedParams = await params;
    const dashboardId = parseInt(resolvedParams.id, 10);
    if (isNaN(dashboardId)) {
      return NextResponse.json({ error: 'Invalid dashboard ID' }, { status: 400 });
    }

    // Ensure dashboard belongs to user
    const existing = await db.query.dashboards.findFirst({
      where: and(eq(dashboards.id, dashboardId), eq(dashboards.userId, user.id)),
    });

    if (!existing) {
      return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 });
    }

    await db.delete(dashboards).where(eq(dashboards.id, dashboardId));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting dashboard:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
