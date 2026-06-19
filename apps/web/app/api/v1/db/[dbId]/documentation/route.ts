import { NextResponse } from 'next/server';
import { db } from '../../../../../../db';
import { connectedDatabases, databaseSchemas } from '../../../../../../db/schema';
import { eq, desc } from 'drizzle-orm';
import { ApiAuthService } from '../../../../../../lib/auth/ApiAuthService';
import { safeErrorResponse, ValidationError } from '../../../../../../lib/errors';
import { generateWithFallbacks } from '@repo/ai';
import { AiRoutingService } from '../../../../../../lib/ai/AiRoutingService';

export async function GET(req: Request, { params }: { params: { dbId: string } }) {
  const startTime = Date.now();
  let authResult;
  let metrics = { requests: 1, llm_tokens: 0 };

  try {
    const dbId = parseInt(params.dbId, 10);
    if (isNaN(dbId)) {
      throw new ValidationError('Invalid Database ID');
    }

    const authHeader = req.headers.get('authorization');
    authResult = await ApiAuthService.validateRequest(authHeader, 'db:query', 'db', dbId);
    
    if (!authResult.isValid) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const [dbConnection] = await db.select().from(connectedDatabases).where(eq(connectedDatabases.id, dbId));
    if (!dbConnection) {
      throw new ValidationError('Database connection not found');
    }

    const [cachedSchema] = await db.select().from(databaseSchemas)
      .where(eq(databaseSchemas.databaseId, dbId))
      .orderBy(desc(databaseSchemas.extractedAt))
      .limit(1);

    if (!cachedSchema) {
      throw new ValidationError('Schema not extracted yet. Please call GET /schema first to extract schema.');
    }

    // 4. Resolve BYOK Provider Config
    const providerConfig = await AiRoutingService.resolveProviderForUser(authResult.userId!, 'database');

    // 5. Generate Documentation using LLM
    const systemPrompt = `You are a Senior Database Architect. You have been given the schema for a ${dbConnection.engine} database.
Generate comprehensive documentation explaining the tables, their purpose, and their relationships.
Return the documentation STRICTLY as a JSON object matching this schema:
{
  "documentation_markdown": "Your detailed markdown string"
}

Schema Data:
${JSON.stringify(cachedSchema.schemaData, null, 2)}
`;

    const llmRes = await generateWithFallbacks(
      {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Generate schema documentation' }
        ],
        agentRole: 'reasoning',
        maxTokens: 4000,
        responseFormatJson: true,
        providerConfig
      },
      process.env.OPENAI_API_KEY || "dummy", 
      process.env.OLLAMA_URL ? `${process.env.OLLAMA_URL}/v1/chat/completions` : undefined
    );

    metrics.llm_tokens += Math.floor((systemPrompt.length + llmRes.content.length) / 4);

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(llmRes.content);
    } catch (e) {
      throw new Error("LLM failed to return a valid JSON object.");
    }

    const durationMs = Date.now() - startTime;
    ApiAuthService.logUsage({
      userId: authResult.userId!,
      apiKeyId: authResult.apiKeyId,
      endpoint: `/v1/db/${dbId}/documentation`,
      resourceType: 'db',
      resourceId: dbId,
      status: 200,
      durationMs,
      metrics
    });

    return NextResponse.json({ documentation: parsedResponse.documentation_markdown });

  } catch (error: unknown) {
    const durationMs = Date.now() - startTime;
    if (authResult?.isValid) {
      ApiAuthService.logUsage({
        userId: authResult.userId!,
        apiKeyId: authResult.apiKeyId,
        endpoint: `/v1/db/${params.dbId}/documentation`,
        resourceType: 'db',
        resourceId: parseInt(params.dbId, 10),
        status: error instanceof ValidationError ? 400 : 500,
        durationMs,
        metrics
      });
    }
    return safeErrorResponse(error, 'V1 DB Documentation Extraction');
  }
}
