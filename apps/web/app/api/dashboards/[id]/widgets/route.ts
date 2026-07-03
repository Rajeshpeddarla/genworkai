import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { dashboards, dashboardWidgets } from '@/db/schema';
import { requireUser } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const { name, description, widgetType, sqlQuery, refreshInterval, visualizationConfig, layoutConfig } = await req.json();

    const [newWidget] = await db
      .insert(dashboardWidgets)
      .values({
        dashboardId,
        name: name || 'New Widget',
        description,
        widgetType: widgetType || 'table',
        sqlQuery,
        refreshInterval: refreshInterval || 'manual',
        visualizationConfig: visualizationConfig || {},
        layoutConfig: layoutConfig || { x: 0, y: 0, w: 4, h: 4 },
      })
      .returning();

    return NextResponse.json(newWidget);
  } catch (error: any) {
    console.error('Error creating widget:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Bulk update layouts
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

    const { layouts } = await req.json(); // Array of { id: number, layoutConfig: any }

    if (!Array.isArray(layouts)) {
      return NextResponse.json({ error: 'Layouts must be an array' }, { status: 400 });
    }

    // Update each layout in a transaction ideally, but we can do it sequentially for now
    await db.transaction(async (tx) => {
      for (const layout of layouts) {
        await tx.update(dashboardWidgets)
          .set({ layoutConfig: layout.layoutConfig, updatedAt: new Date() })
          .where(and(eq(dashboardWidgets.id, layout.id), eq(dashboardWidgets.dashboardId, dashboardId)));
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating widget layouts:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
