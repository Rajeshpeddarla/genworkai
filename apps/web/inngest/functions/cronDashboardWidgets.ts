// @ts-nocheck
import { inngest } from '../client';
import { db } from '@/db';
import { dashboards, dashboardWidgets, connectedDatabases, dashboardWidgetCache } from '@/db/schema';
import { DatabaseService, DBConnectionConfig } from '@/lib/database/DatabaseService';
import { decryptSecret, isEncrypted } from '@/lib/security/encryption';
import { sql, eq, inArray, and, isNotNull, or, lt } from 'drizzle-orm';
import crypto from 'crypto';

export const cronDashboardWidgets: any = inngest.createFunction(
  {
    id: 'cron-dashboard-widgets',
    name: 'Dashboard Widgets Background Refresh',
    concurrency: {
      limit: 5,
    },
    triggers: [{ cron: '* * * * *' }], // Run every minute
  },
  async ({ step, logger }: { step: any; logger: any }) => {
    logger.info('Starting dashboard widgets background refresh');

    // 1. Find widgets that need refreshing
    // In PostgreSQL, we can use raw SQL to filter based on interval string,
    // but a simpler approach for a TS script is to fetch active widgets and check manually,
    // or calculate thresholds in JS and query.
    // For now, let's fetch widgets with refresh_interval != 'manual'
    
    const widgetsToRefresh = await step.run('fetch-due-widgets', async () => {
      const allScheduledWidgets = await db.select({
        widgetId: dashboardWidgets.id,
        dashboardId: dashboardWidgets.dashboardId,
        sqlQuery: dashboardWidgets.sqlQuery,
        refreshInterval: dashboardWidgets.refreshInterval,
        lastRefreshedAt: dashboardWidgets.lastRefreshedAt,
        dataSourceId: dashboards.dataSourceId,
        globalFiltersConfig: dashboards.globalFiltersConfig,
      })
      .from(dashboardWidgets)
      .innerJoin(dashboards, eq(dashboards.id, dashboardWidgets.dashboardId))
      .where(
        and(
          isNotNull(dashboards.dataSourceId),
          isNotNull(dashboardWidgets.sqlQuery),
          sql`${dashboardWidgets.refreshInterval} != 'manual'`
        )
      );

      const now = Date.now();
      return allScheduledWidgets.filter(w => {
        if (!w.lastRefreshedAt) return true; // never refreshed
        const lastRefresh = new Date(w.lastRefreshedAt).getTime();
        
        let intervalMs = 0;
        switch (w.refreshInterval) {
          case '1m': intervalMs = 60 * 1000; break;
          case '5m': intervalMs = 5 * 60 * 1000; break;
          case '15m': intervalMs = 15 * 60 * 1000; break;
          case '30m': intervalMs = 30 * 60 * 1000; break;
          case '1h': intervalMs = 60 * 60 * 1000; break;
          case '6h': intervalMs = 6 * 60 * 60 * 1000; break;
          case '1d': intervalMs = 24 * 60 * 60 * 1000; break;
          case '1w': intervalMs = 7 * 24 * 60 * 60 * 1000; break;
          case '1mo': intervalMs = 30 * 24 * 60 * 60 * 1000; break;
          default: return false; // Handle custom cron parsing if needed later
        }
        
        return now - lastRefresh >= intervalMs;
      });
    });

    if (widgetsToRefresh.length === 0) {
      logger.info('No widgets due for refresh.');
      return { success: true, count: 0 };
    }
    
    logger.info(`Found ${widgetsToRefresh.length} widgets to refresh.`);

    // Group by data source to minimize connections
    const byDataSource = widgetsToRefresh.reduce((acc, widget) => {
      const key = widget.dataSourceId!.toString();
      if (!acc[key]) acc[key] = [];
      acc[key].push(widget);
      return acc;
    }, {} as Record<string, typeof widgetsToRefresh>);

    let totalRefreshed = 0;
    let totalErrors = 0;

    for (const [dataSourceIdStr, widgets] of Object.entries(byDataSource)) {
      const dataSourceId = parseInt(dataSourceIdStr, 10);
      
      await step.run(`refresh-source-${dataSourceId}`, async () => {
        try {
          const dbRecords = await db.select().from(connectedDatabases).where(eq(connectedDatabases.id, dataSourceId));
          if (dbRecords.length === 0) {
            logger.warn(`Data source ${dataSourceId} not found.`);
            return;
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

          for (const widget of widgets) {
            try {
              const finalQuery = widget.sqlQuery!;
              // Basic safety check
              const upperQuery = finalQuery.toUpperCase();
              if (upperQuery.includes('DELETE ') || upperQuery.includes('DROP ') || upperQuery.includes('UPDATE ') || upperQuery.includes('INSERT ') || upperQuery.includes('ALTER ') || upperQuery.includes('TRUNCATE ')) {
                logger.warn(`Widget ${widget.widgetId} has forbidden SQL. Skipping.`);
                continue;
              }

              const startTime = Date.now();
              const results = await dbService.executeQuery(finalQuery);
              const executionTime = Date.now() - startTime;

              const hash = crypto.createHash('md5').update(finalQuery).digest('hex');

              await db.insert(dashboardWidgetCache).values({
                widgetId: widget.widgetId,
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
              }).where(eq(dashboardWidgets.id, widget.widgetId));

              totalRefreshed++;
            } catch (err: any) {
              logger.error(`Error refreshing widget ${widget.widgetId}: ${err.message}`);
              totalErrors++;
            }
          }
        } catch (sourceErr: any) {
           logger.error(`Error processing data source ${dataSourceId}: ${sourceErr.message}`);
        }
      });
    }

    return {
      success: true,
      refreshedCount: totalRefreshed,
      errorCount: totalErrors,
    };
  }
);
