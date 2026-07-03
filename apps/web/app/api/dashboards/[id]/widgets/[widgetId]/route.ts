import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { dashboards, dashboardWidgets, dashboardWidgetCache } from '@/db/schema';
import { requireUser } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string, widgetId: string }> }) {
  try {
    const { user, error } = await requireUser();
    if (error) return error;

    const resolvedParams = await params;
    const dashboardId = parseInt(resolvedParams.id, 10);
    const widgetId = parseInt(resolvedParams.widgetId, 10);
    if (isNaN(dashboardId) || isNaN(widgetId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    // Ensure dashboard belongs to user
    const existing = await db.query.dashboards.findFirst({
      where: and(eq(dashboards.id, dashboardId), eq(dashboards.userId, user.id)),
    });

    if (!existing) {
      return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 });
    }

    const body = await req.json();

    const [updatedWidget] = await db
      .update(dashboardWidgets)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(and(eq(dashboardWidgets.id, widgetId), eq(dashboardWidgets.dashboardId, dashboardId)))
      .returning();

    return NextResponse.json(updatedWidget);
  } catch (error: any) {
    console.error('Error updating widget:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string, widgetId: string }> }) {
  try {
    const { user, error } = await requireUser();
    if (error) return error;

    const resolvedParams = await params;
    const dashboardId = parseInt(resolvedParams.id, 10);
    const widgetId = parseInt(resolvedParams.widgetId, 10);
    if (isNaN(dashboardId) || isNaN(widgetId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    // Ensure dashboard belongs to user
    const existing = await db.query.dashboards.findFirst({
      where: and(eq(dashboards.id, dashboardId), eq(dashboards.userId, user.id)),
    });

    if (!existing) {
      return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 });
    }

    // Delete cache first if necessary (cascade should handle it, but good to be explicit if cascade is not configured correctly)
    await db.delete(dashboardWidgetCache).where(eq(dashboardWidgetCache.widgetId, widgetId));
    await db.delete(dashboardWidgets).where(and(eq(dashboardWidgets.id, widgetId), eq(dashboardWidgets.dashboardId, dashboardId)));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting widget:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
