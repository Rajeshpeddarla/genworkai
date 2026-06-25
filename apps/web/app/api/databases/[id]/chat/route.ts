import { NextResponse } from 'next/server';
import { db } from '../../../../../db';
import { databaseSchemas, connectedDatabases } from '../../../../../db/schema';
import { eq } from 'drizzle-orm';
import { generateWithFallbacks, TaskCategory } from '@repo/ai';
import { requireUser, requireOwnership } from '../../../../../lib/auth';
import { safeErrorResponse, ValidationError } from '../../../../../lib/errors';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, error } = await requireUser();
    if (error) return error;
    const { message } = await req.json();
    const resolvedParams = await params;
    const dbId = parseInt(resolvedParams.id, 10);

    if (!message) {
      throw new ValidationError('Message is required');
    }

    const targetDb = await db.select().from(connectedDatabases).where(eq(connectedDatabases.id, dbId)).limit(1);
    if (!targetDb || targetDb.length === 0) {
      throw new ValidationError('Database not found');
    }

    const ownershipError = await requireOwnership('database', dbId, user.id);
    if (ownershipError) return ownershipError;

    const schemas = await db.select().from(databaseSchemas).where(eq(databaseSchemas.databaseId, dbId));
    if (schemas.length === 0) {
      return NextResponse.json({ error: 'Database schema not found. Cannot generate SQL.' }, { status: 404 });
    }

    const schemaData = schemas[0]!.schemaData;

    const apiKey = process.env.DEEPSEEK_API_KEY || '';
    if (!apiKey) {
      return NextResponse.json({ error: 'AI API Key is not configured' }, { status: 500 });
    }

    const prompt = `You are an expert SQL assistant.
The user wants to query their database. Here is the exact schema for their database:
\`\`\`json
${JSON.stringify(schemaData, null, 2)}
\`\`\`

User Request: "${message}"

Write a PostgreSQL SELECT query to fulfill the user's request. 
CRITICAL RULES:
1. ONLY return a SELECT statement. Never use INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE, etc.
2. Only use columns and tables that explicitly exist in the schema provided above, UNLESS the user explicitly asks for system catalog tables (like information_schema, pg_catalog, pg_policies). In that case, you may query them directly without apologizing or stating they are not in the schema.
3. Return your response as a JSON object matching this schema exactly:
{
  "message": "A brief explanation of the query and what it does",
  "sql": "The raw SQL SELECT statement"
}`;

    const aiRes = await generateWithFallbacks({
      messages: [{ role: 'system', content: prompt }],
      responseFormatJson: true,
      taskCategory: TaskCategory.REASONING
    }, apiKey, process.env.DEEPSEEK_API_URL);

    let parsed = { message: "Generated query.", sql: "" };
    try {
      const match = aiRes.content.match(/```json\n([\s\S]*?)\n```/) || aiRes.content.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[1] || match[0]);
      } else {
        parsed = JSON.parse(aiRes.content);
      }
    } catch (e) {
      console.error("Failed to parse AI SQL JSON:", aiRes.content);
      return NextResponse.json({ error: 'Failed to generate valid SQL. Try rephrasing.' }, { status: 500 });
    }

    return NextResponse.json(parsed);
  } catch (error: unknown) {
    return safeErrorResponse(error, 'Chat with Database Route');
  }
}
