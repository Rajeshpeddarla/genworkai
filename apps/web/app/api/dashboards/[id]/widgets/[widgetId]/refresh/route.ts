import { NextResponse } from 'next/server';
import { db } from '@/db';
import { dashboards, dashboardWidgets, connectedDatabases, dashboardWidgetCache } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireUser, requireOwnership } from '@/lib/auth';
import { DatabaseService, DBConnectionConfig } from '@/lib/database/DatabaseService';
import { safeErrorResponse, NotFoundError } from '@/lib/errors';
import { decryptSecret, isEncrypted } from '@/lib/security/encryption';
import crypto from 'crypto';

export async function POST(req: Request, { params }: { params: Promise<{ id: string, widgetId: string }> }) {
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
    const existingDashboard = await db.query.dashboards.findFirst({
      where: and(eq(dashboards.id, dashboardId), eq(dashboards.userId, user.id)),
    });

    if (!existingDashboard) {
      return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 });
    }

    if (!existingDashboard.dataSourceId) {
      return NextResponse.json({ error: 'Dashboard has no connected data source' }, { status: 400 });
    }

    // Verify ownership of the data source
    const ownershipError = await requireOwnership('database', existingDashboard.dataSourceId, user.id);
    if (ownershipError) return ownershipError;

    const widget = await db.query.dashboardWidgets.findFirst({
      where: and(eq(dashboardWidgets.id, widgetId), eq(dashboardWidgets.dashboardId, dashboardId)),
    });

    if (!widget) {
      return NextResponse.json({ error: 'Widget not found' }, { status: 404 });
    }

    if (!widget.sqlQuery) {
      return NextResponse.json({ error: 'Widget has no SQL query' }, { status: 400 });
    }

    // 1. Setup Database Service
    const dbRecords = await db.select().from(connectedDatabases).where(eq(connectedDatabases.id, existingDashboard.dataSourceId));
    if (dbRecords.length === 0) {
      throw new NotFoundError('Database');
    }
    const dbRecord = dbRecords[0]!;

    const connectionString = dbRecord.connectionString
      ? (isEncrypted(dbRecord.connectionString) ? decryptSecret(dbRecord.connectionString) : dbRecord.connectionString)
      : undefined;
      
    const password = dbRecord.password
      ? (isEncrypted(dbRecord.password) ? decryptSecret(dbRecord.password) : dbRecord.password)
      : undefined;

    const config: DBConnectionConfig = {
      engine: dbRecord.engine as any,
      connectionString,
      host: dbRecord.host || undefined,
      port: typeof dbRecord.port === 'number' ? dbRecord.port : (dbRecord.port ? parseInt(String(dbRecord.port), 10) : undefined),
      database: dbRecord.databaseName || undefined,
      username: dbRecord.username || undefined,
      password,
    };

    const dbService = new DatabaseService(config);

    // TODO: Inject global filters into the SQL query here before execution
    const finalQuery = widget.sqlQuery;
    
    // Security check: Only allow SELECT, WITH, EXPLAIN
    const upperQuery = finalQuery.toUpperCase();
    if (upperQuery.includes('DELETE ') || upperQuery.includes('DROP ') || upperQuery.includes('UPDATE ') || upperQuery.includes('INSERT ') || upperQuery.includes('ALTER ') || upperQuery.includes('TRUNCATE ')) {
      return NextResponse.json({ error: 'Only read-only queries are allowed' }, { status: 403 });
    }

    let results;
    let executionTime;
    try {
      const startTime = Date.now();
      results = await dbService.executeQuery(finalQuery);
      executionTime = Date.now() - startTime;
    } catch (dbError: any) {
      return NextResponse.json({ error: `Database Error: ${dbError.message}` }, { status: 400 });
    }

    // Cache the results
    const hash = crypto.createHash('md5').update(finalQuery).digest('hex');
    
    await db.insert(dashboardWidgetCache).values({
      widgetId,
      data: results,
      hash,
      updatedAt: new Date(),
    }).onConflictDoUpdate({
      target: dashboardWidgetCache.widgetId,
      set: {
        data: results,
        hash,
        updatedAt: new Date(),
      }
    });

    await db.update(dashboardWidgets).set({
      lastRefreshedAt: new Date(),
      lastExecutionTime: executionTime,
      updatedAt: new Date(),
    }).where(eq(dashboardWidgets.id, widgetId));

    return NextResponse.json({ success: true, results, executionTime });
  } catch (error: unknown) {
    return safeErrorResponse(error, 'Widget Refresh Route');
  }
}
