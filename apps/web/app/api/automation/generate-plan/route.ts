import { NextResponse } from 'next/server';
import { requireUser } from '../../../../lib/auth';
import { db } from '../../../../db';
import { knowledgeBases, connectedDatabases, databaseSchemas } from '../../../../db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const planSchema = z.object({
  isReady: z.boolean().describe("Set to true if you have enough information to generate the full automation plan. Set to false if you need to ask a follow-up question."),
  followUpQuestion: z.string().optional().describe("If isReady is false, ask the user a clarifying question."),
  name: z.string().optional(),
  description: z.string().optional(),
  goal: z.string().optional(),
  source: z.string().optional(),
  trigger: z.string().optional(),
  schedule: z.string().optional(), 
  sql: z.string().optional(), 
  artifactTypes: z.array(z.string()).optional(),
  workflowSteps: z.array(z.object({
    id: z.string(),
    type: z.string(), // 'source', 'action', 'output', 'schedule'
    label: z.string(),
    details: z.string().optional()
  })).optional(),
  estimatedCredits: z.number().optional(),
  estimatedMonthlyCredits: z.number().optional(),
  estimatedRuntime: z.string().optional(),
  provider: z.string().optional(),
  billingMode: z.string().optional(),
  confidence: z.number().optional(),
  assumptions: z.array(z.string()).optional(),
  requiredResources: z.array(z.string()).optional(),
  warnings: z.array(z.string()).optional(),
  runsPerMonth: z.number().optional()
});

export async function POST(req: Request) {
  try {
    const { user, error: authError } = await requireUser();
    if (authError || !user) return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    const { messages, sourceId, sourceType, currentPlan } = await req.json();

    if (!messages || !messages.length) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }

    let contextText = '';
    
    // If a source is selected, fetch context
    if (sourceType === 'kb' && sourceId) {
      const kb = await db.query.knowledgeBases.findFirst({
        where: eq(knowledgeBases.id, parseInt(sourceId))
      });
      if (kb) {
        contextText = `Source Context: The user wants to build an automation for Knowledge Base "${kb.name}".`;
      }
    } else if (sourceType === 'db' && sourceId) {
      const dbInfo = await db.query.connectedDatabases.findFirst({
        where: eq(connectedDatabases.id, parseInt(sourceId))
      });
      if (dbInfo) {
        const schemaInfo = await db.query.databaseSchemas.findFirst({
          where: eq(databaseSchemas.databaseId, dbInfo.id)
        });
        contextText = `Source Context: The user wants to build an automation for Database "${dbInfo.name}".\n\n`;
        if (schemaInfo && schemaInfo.schemaData) {
          contextText += `Database Schema: ${JSON.stringify(schemaInfo.schemaData)}`;
        }
      }
    }

    if (currentPlan) {
      contextText += `\n\nCURRENT PLAN (Update this based on the user's new request):\n${JSON.stringify(currentPlan, null, 2)}`;
    }

    const systemPrompt = `You are the Automation Studio AI Builder. 
Your goal is to help the user configure a robust enterprise automation task without them needing to write code, schedules, or configure manual steps.

You must gather enough information to determine:
- The exact intent and goal
- The schedule (e.g., daily, weekly) or trigger (e.g., on event)
- The output format (document, pdf, spreadsheet, email, etc.)
- For databases, the exact SQL query required to fetch the data.

If you DO NOT have enough information, set isReady to false and ask a SINGLE clear followUpQuestion.
CRITICAL: If the user wants to generate content (like a quiz, summary, report) or query data, you MUST verify what source data to use. If they have not explicitly mentioned a knowledge base, database, or documents to use as the source, you MUST set isReady to false and ask them what knowledge base or pages they want to use. You cannot generate a quiz or report out of thin air without a source.
If you DO have enough information, set isReady to true and populate all other fields to generate the plan.

${contextText}

Guidelines when generating a plan:
- estimatedCredits: Standard runs cost ~3 credits. Intensive ones cost ~10.
- estimatedMonthlyCredits: runsPerMonth * estimatedCredits.
- runsPerMonth: e.g. 30 for daily, 4 for weekly.
- provider: usually "DeepSeek" or "OpenAI".
- billingMode: "platform".
- workflowSteps: return a logical array of steps. e.g. [{id: '1', type: 'source', label: 'Knowledge Base'}, {id: '2', type: 'action', label: 'Summarize'}, {id: '3', type: 'output', label: 'Generate PDF'}, {id: '4', type: 'schedule', label: 'Every Monday'}]`;

    if (!process.env.DEEPSEEK_API_KEY) {
      throw new Error("Missing DEEPSEEK_API_KEY environment variable");
    }

    const schemaPrompt = `
You must respond with ONLY a valid JSON object matching this schema:
{
  "isReady": boolean,
  "followUpQuestion": string (optional, required if isReady is false),
  "name": string (optional),
  "goal": string (optional),
  "artifactTypes": array of strings (optional),
  "sql": string (optional),
  "estimatedCredits": number (optional),
  "estimatedMonthlyCredits": number (optional),
  "provider": string (optional),
  "billingMode": string (optional),
  "workflowSteps": array of objects {id: string, type: 'source'|'action'|'output'|'schedule', label: string} (optional),
  "requiredResources": array of strings (optional),
  "warnings": array of strings (optional),
  "runsPerMonth": number (optional)
}
Do not include markdown blocks, just the JSON string.`;

    const deepseekReq = {
      model: process.env.DEEPSEEK_MODEL || "deepseek-v4-flash",
      messages: [
        { role: "system", content: systemPrompt + schemaPrompt },
        ...messages
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    };

    const response = await fetch((process.env.DEEPSEEK_API_URL || "https://api.deepseek.com") + "/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify(deepseekReq)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("DeepSeek API Error:", response.status, errText);
      return NextResponse.json({ error: "Failed to generate plan from AI provider" }, { status: 500 });
    }

    const result = await response.json();
    const text = result.choices?.[0]?.message?.content || "";

    let objectData;
    try {
      const cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      objectData = JSON.parse(cleanText);
    } catch(e) {
      console.error("Failed to parse AI output:", text);
      return NextResponse.json({ error: "Failed to parse AI output" }, { status: 500 });
    }

    return NextResponse.json(objectData);

  } catch (error: any) {
    console.error('Planner Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
