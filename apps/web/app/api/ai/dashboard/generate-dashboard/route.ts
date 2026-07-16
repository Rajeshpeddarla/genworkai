import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { db } from '@/db';
import { connectedDatabases, dashboards, dashboardWidgets } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { generateObject } from 'ai';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { z } from 'zod';
import { DatabaseService, DBConnectionConfig } from '@/lib/database/DatabaseService';
import { decryptSecret, isEncrypted } from '@/lib/security/encryption';

const deepseek = createDeepSeek({
  apiKey: process.env.GEMINI_API_KEY || "",
});

export const maxDuration = 120; // Generating a whole dashboard might take longer

export async function POST(req: Request) {
  try {
    const { user, error } = await requireUser();
    if (error) return error;

    const { name, description, dataSourceId, prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    let schemaContext = 'No database connected.';
    if (dataSourceId) {
      const dbRecords = await db.select().from(connectedDatabases).where(eq(connectedDatabases.id, dataSourceId));
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
Your goal is to generate a complete dashboard with multiple widgets based on the user's prompt.
You have access to the following database schema context to generate appropriate SQL queries.

${schemaContext}

CRITICAL INSTRUCTIONS:
- You must generate a cohesive dashboard with an appropriate name, description, and multiple widgets.
- Each widget MUST have a valid SQL query. Generate SQL that is strictly READ-ONLY (SELECT) and matches the schema provided.
- Supported widget types: 'table', 'line', 'bar', 'pie', 'stat', 'area'.
- Make sure to use appropriate widget types for the data (e.g., 'line' for time series, 'stat' for single KPIs).
- Ensure the JSON conforms exactly to the requested schema.`;

    const userPrompt = `User Request: ${prompt}

Additional Dashboard Info provided by user:
Name: ${name || 'Not provided'}
Description: ${description || 'Not provided'}`;

    const schema = z.object({
      name: z.string().describe('The name of the dashboard.'),
      description: z.string().describe('A short description of the dashboard.'),
      widgets: z.array(z.object({
        name: z.string().describe('Title of the widget'),
        description: z.string().describe('Short description of what the widget shows'),
        widgetType: z.enum(['table', 'line', 'bar', 'pie', 'stat', 'area']),
        sqlQuery: z.string().describe('The SELECT SQL query to fetch data for this widget')
      })).describe('An array of widgets to include in the dashboard. Try to include 3 to 6 widgets to make a complete dashboard.')
    });

    console.log("[Backend] Generating dashboard with AI...");

    const { object } = await generateObject({
      model: deepseek('deepseek-v4-flash'),
      system: systemPrompt,
      prompt: userPrompt,
      schema: schema,
    });

    console.log("[Backend] AI Generation Complete. Inserting to DB...");

    // 1. Insert Dashboard
    const [insertedDashboard] = await db.insert(dashboards).values({
      userId: user.id,
      dataSourceId: dataSourceId || null,
      name: object.name || name || 'AI Generated Dashboard',
      description: object.description || description || '',
      coverColor: '#8b5cf6', // Default violet
      isAiGenerated: true,
    }).returning();

    if (!insertedDashboard) {
      throw new Error("Failed to insert dashboard.");
    }

    // 2. Insert Widgets with layout calculation
    if (object.widgets && object.widgets.length > 0) {
      const widgetInserts = object.widgets.map((w, index) => {
        // Simple grid layout: 2 columns, each widget takes w=6, h=4
        // A 12-column grid is standard
        const isEven = index % 2 === 0;
        const x = isEven ? 0 : 6;
        const y = Math.floor(index / 2) * 4;
        
        return {
          dashboardId: insertedDashboard.id,
          name: w.name,
          description: w.description || '',
          widgetType: w.widgetType,
          sqlQuery: w.sqlQuery,
          refreshInterval: 'manual',
          visualizationConfig: {},
          layoutConfig: { x, y, w: 6, h: 4 },
        };
      });

      await db.insert(dashboardWidgets).values(widgetInserts);
    }

    return NextResponse.json({ dashboardId: insertedDashboard.id });

  } catch (err: any) {
    console.error('Error generating dashboard:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
