import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { db } from '@/db';
import { connectedDatabases, dashboards } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { generateText } from 'ai';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { DatabaseService, DBConnectionConfig } from '@/lib/database/DatabaseService';
import { decryptSecret, isEncrypted } from '@/lib/security/encryption';

const deepseek = createDeepSeek({
  apiKey: process.env.GEMINI_API_KEY || "",
});

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { user, error } = await requireUser();
    if (error) return error;

    const { dashboardId, prompt, widgetType } = await req.json();

    if (!dashboardId || !prompt) {
      return NextResponse.json({ error: 'Dashboard ID and prompt are required' }, { status: 400 });
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

    let widgetInstructions = '';
    if (widgetType === 'stat') {
       widgetInstructions = '5. WIDGET TYPE IS "STAT": You MUST return a query that produces exactly ONE row and ONE column containing a single numerical metric (like a total COUNT or SUM).';
    } else if (['bar', 'line', 'area', 'pie'].includes(widgetType)) {
       widgetInstructions = `5. WIDGET TYPE IS "${widgetType.toUpperCase()} CHART": You MUST return an aggregated query grouped by a category. It MUST have at least one string/date column for the X-axis, and at least one numerical column (like COUNT or SUM) for the Y-axis. NEVER return un-aggregated raw rows. IF the user asks for a raw list (e.g., "show me all users"), YOU MUST FORCEFULLY group them by a logical column (like DATE(created_at), status, or role) to create a chartable output.`;
    } else {
       widgetInstructions = '5. WIDGET TYPE IS "TABLE": You can return un-aggregated raw rows, or grouped data. Pick 4-6 most useful columns.';
    }

    const systemPrompt = `You are an expert SQL Data Analyst. Your goal is to generate ONLY a raw SQL SELECT query based on the user's prompt. 
Do not wrap it in markdown blockquotes, do not add explanations. Just return the raw SQL.

CRITICAL INSTRUCTIONS FOR DASHBOARD WIDGETS:
1. Return aggregated data (e.g. COUNT, SUM, AVG) grouped by categories where possible, as this is used for charts.
2. Use AS to provide clean, human-readable aliases for all columns. **CRITICAL: You MUST use double quotes (" ") for aliases with spaces, NEVER single quotes.** (e.g., AS "Total Revenue" instead of AS 'Total Revenue'). PostgreSQL will crash if you use single quotes for aliases.
3. Do not do SELECT * unless explicitly asked. Pick 2-3 meaningful columns (usually a category/date and a metric).
4. If the prompt is empty or vague, pick the most important table from the schema and generate a meaningful summary (e.g., top 5 records by a metric, or count of records by status).
${widgetInstructions}

${schemaContext}
`;

    const result = await generateText({
      model: deepseek('deepseek-v4-flash'),
      system: systemPrompt,
      prompt: `Write a READ-ONLY SQL query for: ${prompt}`,
    });

    // Clean up potential markdown blocks if the model ignores the instruction
    let sql = result.text.trim();
    if (sql.startsWith('```sql')) {
        sql = sql.replace(/^```sql/, '').replace(/```$/, '').trim();
    } else if (sql.startsWith('```')) {
        sql = sql.replace(/^```/, '').replace(/```$/, '').trim();
    }

    return NextResponse.json({ sql });
  } catch (err: any) {
    console.error('SQL Generation Error:', err);
    return NextResponse.json({ error: 'Failed to generate SQL' }, { status: 500 });
  }
}
