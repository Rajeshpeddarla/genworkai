import { NextResponse } from 'next/server';
import { requireUser } from '../../../../lib/auth';
import { db } from '../../../../db';
import { generateText } from 'ai';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { EntitlementEngine } from '../../../../lib/billing/entitlements';
import { DatabaseService } from '../../../../lib/database/DatabaseService';

const deepseek = createDeepSeek({
  apiKey: process.env.GEMINI_API_KEY || "",
});

export async function POST(req: Request) {
  try {
    const { user, error: authError } = await requireUser();
    if (authError || !user) return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    
    // Check AI credits for test run
    const creditCheck = await EntitlementEngine.checkLimit({ userId: user.id, resource: 'ai_credits', incrementAmount: 3 });
    if (!creditCheck.allowed) {
      return NextResponse.json({ error: creditCheck.reason }, { status: 403 });
    }

    let sqlResults = null;

    if (body.category === 'database' && body.sqlQuery && body.sources && body.sources.length > 0) {
      const sourceId = body.sources[0].id;
      const dbInfo = await db.query.connectedDatabases.findFirst({
        where: (dbs, { eq }) => eq(dbs.id, parseInt(sourceId))
      });
      if (dbInfo) {
        const dbService = new DatabaseService(dbInfo as any);
        try {
          const res = await dbService.executeQuery(`SELECT * FROM (${body.sqlQuery}) as sub LIMIT 10`);
          sqlResults = res;
        } catch (e: any) {
          return NextResponse.json({ error: `SQL Error: ${e.message}` }, { status: 400 });
        }
      }
    }

    const systemPrompt = `You are a specialized AI executing an automation task for the user.
Your role depends on the category:
- knowledge: Process materials and synthesize educational/summary documents.
- database: Formulate data quality reports, SQL schema audit notes, or analytics summaries.
- workspace: Create a polished workspace artifact fulfilling the specific goal.

Based on the task name and goal, generate the final output in pure Markdown format.`;

    let dataContext = '';
    if (sqlResults) {
      dataContext = `\n\nDatabase Query Results Preview (Top 10 rows):\n\`\`\`json\n${JSON.stringify(sqlResults, null, 2)}\n\`\`\``;
    }

    const promptText = `Execute the following test automation task:
Task Name: ${body.name}
Description: ${body.description || "None"}
Goal: ${body.goal || "None"}
Target Artifact Types: ${body.artifactTypes?.join(", ") || "None"}
${dataContext}`;

    const startTime = Date.now();
    
    if (!process.env.GEMINI_API_KEY) {
      // Mock for local without key
      return NextResponse.json({
        success: true,
        generatedContent: `# Mock Result\n\nNo API Key found. This is a mock result for ${body.name}.\n\n${dataContext}`,
        sqlResults,
        executionTimeMs: 150,
        creditsConsumed: 0
      });
    }

    const result = await generateText({
      model: deepseek(process.env.DEEPSEEK_MODEL || "deepseek-v4-flash"),
      system: systemPrompt,
      prompt: promptText,
    });
    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      generatedContent: result.text,
      sqlResults,
      executionTimeMs: duration,
      creditsConsumed: 3
    });

  } catch (error: any) {
    console.error('Test Run Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
