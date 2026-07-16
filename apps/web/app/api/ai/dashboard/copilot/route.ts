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
  apiKey: process.env.GEMINI_API_KEY || "",
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

CRITICAL INSTRUCTION:
When the user asks you to create a widget, chart, or graph, you MUST output a JSON block wrapped in markdown. Do NOT use any tool calling APIs.
You MUST output EXACTLY this format in your response:

\`\`\`json
{
  "name": "Title of the widget",
  "widgetType": "table",
  "sqlQuery": "SELECT * FROM ...",
  "description": "Short description"
}
\`\`\`

Available widget types: 'table', 'line', 'bar', 'pie', 'stat', 'area'.
You MUST provide a valid SQL query. Only generate SQL that is strictly READ-ONLY (SELECT).
Respond conversationally before or after the JSON block.`;

    const result = streamText({
      model: deepseek('deepseek-v4-flash'),
      system: systemPrompt,
      messages: messages
        .filter((m: any) => {
          if (m.role === 'system') return true;
          if (m.role === 'user') return true;
          if (m.role === 'assistant') {
            return typeof m.content === 'string' && m.content.length > 0;
          }
          return false;
        })
        .map((m: any) => {
          return { 
            role: m.role,
            content: m.content
          };
        }),
      onFinish: async (completion) => {
        console.log("DEEPSEEK COMPLETED RESPONSE:");
        const text = completion.text || "";
        console.log(text);
        
        // Directly parse and create widget in the backend
        let jsonStr = null;
        const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
        if (match) {
          jsonStr = match[1];
        } else {
          const firstBrace = text.indexOf('{');
          const lastBrace = text.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            jsonStr = text.substring(firstBrace, lastBrace + 1);
          }
        }
        
        if (jsonStr) {
          try {
            const body = JSON.parse(jsonStr);
            if (body && typeof body === 'object' && (body.sqlQuery || body.sql_query || body.sql || body.query)) {
              
              const sqlQuery = body.sqlQuery || body.sql_query || body.query || body.sql;
              console.log("[Backend] Creating widget:", body.name);
              
              // Automatically fetch the db schema for dashboardWidgets and insert
              const { dashboardWidgets } = require('@/db/schema');
              await db.insert(dashboardWidgets).values({
                dashboardId: parseInt(dashboardId, 10),
                name: body.name || body.title || 'AI Generated Widget',
                description: body.description || JSON.stringify(body),
                widgetType: body.widgetType || body.widget_type || 'table',
                sqlQuery: sqlQuery,
                refreshInterval: body.refreshInterval || 'manual',
                visualizationConfig: body.visualizationConfig || {},
                layoutConfig: body.layoutConfig || { x: 0, y: 0, w: 4, h: 4 },
              });
              console.log("[Backend] Widget saved successfully!");
            }
          } catch (e) {
            console.error("Failed to parse AI widget JSON in backend", e);
          }
        }
      }
    });

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.textStream) {
            controller.enqueue(new TextEncoder().encode(`0:${JSON.stringify(chunk)}\n`));
          }
        } catch (err) {
          console.error("Stream error:", err);
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'x-vercel-ai-data-stream': 'v1'
      }
    });
  } catch (error: any) {
    console.error('Copilot API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
