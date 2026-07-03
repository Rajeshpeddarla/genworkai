// @ts-nocheck
import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { db } from '@/db';
import { connectedDatabases, dashboards } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { streamText, tool } from 'ai';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { z } from 'zod';
import { DatabaseService, DBConnectionConfig } from '@/lib/database/DatabaseService';
import { decryptSecret, isEncrypted } from '@/lib/security/encryption';

const deepseek = createDeepSeek({
  apiKey: process.env.DEEPSEEK_API_KEY || "",
});

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { user, error } = await requireUser();
    if (error) return error;

    const { messages, dashboardId } = await req.json();

    if (!dashboardId) {
      return NextResponse.json({ error: 'Dashboard ID is required' }, { status: 400 });
    }

    const dashboard = await db.query.dashboards.findFirst({
      where: and(eq(dashboards.id, dashboardId), eq(dashboards.userId, user.id)),
    });

    if (!dashboard) {
      return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 });
    }

    let schemaContext = 'No database connected.';

    if (dashboard.dataSourceId) {
      const dbRecords = await db.select().from(connectedDatabases).where(eq(connectedDatabases.id, dashboard.dataSourceId));
      if (dbRecords.length > 0) {
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
        
        try {
           const tables = await dbService.extractSchema();
           schemaContext = `Database Schema:\n${JSON.stringify(tables, null, 2)}`;
        } catch (e) {
           schemaContext = 'Failed to retrieve schema for connected database.';
        }
      }
    }

    const systemPrompt = `You are an expert BI Dashboard assistant for GenWorkAI.
Your goal is to help the user build and manage their dashboard.
The user is viewing a dashboard named "${dashboard.name}".

${schemaContext}

You can use the 'create_widget' tool to automatically generate a widget configuration (SQL + Chart type).
Only generate SQL that is strictly READ-ONLY (SELECT).
Widget types available: 'table', 'line', 'bar', 'pie', 'stat', 'area'.
Respond conversationally, and use tools when the user asks you to create or add a widget.
`;

    const result = streamText({
      model: deepseek('deepseek-chat'),
      system: systemPrompt,
      messages,
      tools: {
        create_widget: tool({
          description: 'Create a new dashboard widget with SQL query and visualization config.',
          parameters: z.object({
            name: z.string().describe('Title of the widget'),
            widgetType: z.enum(['table', 'line', 'bar', 'pie', 'stat', 'area']).describe('Type of chart'),
            sqlQuery: z.string().describe('PostgreSQL/MySQL SELECT query'),
            description: z.string().optional().describe('Short description of what the widget shows'),
          }),
          execute: async (params) => {
            return {
              success: true,
              message: `Generated widget configuration for "${params.name}"`,
              widgetConfig: params
            };
          }
        })
      }
    });

    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error('Copilot API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
