import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { db } from '@/db';
import { connectedDatabases, databaseSchemas } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { generateText } from 'ai';
import { createDeepSeek } from '@ai-sdk/deepseek';

const deepseek = createDeepSeek({
  apiKey: process.env.DEEPSEEK_API_KEY || '',
});

export async function POST(req: Request) {
  try {
    const { user, error } = await requireUser();
    if (error) return error;

    const { prompt, databaseId } = await req.json();

    if (!prompt || !databaseId) {
      return NextResponse.json({ error: 'Missing prompt or databaseId' }, { status: 400 });
    }

    // Verify DB exists
    const conn = await db.query.connectedDatabases.findFirst({
      where: eq(connectedDatabases.id, parseInt(databaseId))
    });

    if (!conn) {
      return NextResponse.json({ error: 'Database not found' }, { status: 404 });
    }

    // Attempt to fetch schema data if we have it
    const schemaDataRecord = await db.query.databaseSchemas.findFirst({
      where: eq(databaseSchemas.databaseId, conn.id),
      orderBy: [desc(databaseSchemas.extractedAt)]
    });

    let schemaContext = 'No specific schema provided. Assume standard tables if not specified.';
    if (schemaDataRecord?.schemaData) {
      schemaContext = `Schema structure (JSON):\n${JSON.stringify(schemaDataRecord.schemaData)}`;
    }

    const systemPrompt = `You are an expert SQL generator for ${conn.engine.toUpperCase()} databases.
Your job is to write a purely READ-ONLY SELECT query based on the user's natural language request.
NEVER generate INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE, or CREATE statements.

Context about the database schema:
${schemaContext}

Output ONLY the raw SQL query. Do not wrap it in markdown block quotes (\`\`\`). Just the raw SQL text.`;

    if (!process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json({ error: 'AI API Key is not configured' }, { status: 500 });
    }

    const { text } = await generateText({
      model: deepseek('deepseek-v4-flash'),
      system: systemPrompt,
      prompt: prompt,
      temperature: 0,
    });

    return NextResponse.json({ sql: text.trim() });
  } catch (error: any) {
    console.error('Generate SQL error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
