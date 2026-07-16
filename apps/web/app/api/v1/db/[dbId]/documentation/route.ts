import { NextResponse } from 'next/server';
import { db } from '../../../../../../db';
import { connectedDatabases, databaseSchemas } from '../../../../../../db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { ApiAuthService } from '../../../../../../lib/auth/ApiAuthService';
import { safeErrorResponse, ValidationError } from '../../../../../../lib/errors';
import { RateLimitService } from '../../../../../../lib/security/rate-limit';
import { generateWithFallbacks, TaskCategory } from '@repo/ai';
import { AiRoutingService } from '../../../../../../lib/ai/AiRoutingService';

export async function GET(req: Request, { params }: { params: Promise<{ dbId: string }> }) {
  const startTime = Date.now();
  let authResult;
  let metrics = { requests: 1, llm_tokens: 0 };

  try {
    const p = await params;
    const dbIdStr = p.dbId;
    const dbId = parseInt(dbIdStr, 10);
    if (isNaN(dbId)) {
      throw new ValidationError('Invalid Database ID');
    }

    const authHeader = req.headers.get('authorization');
    authResult = await ApiAuthService.validateRequest(authHeader, 'db:query', 'db', dbId);
    
    if (!authResult.isValid) {
      throw new ValidationError(authResult.error || 'Unauthorized');
    }

    const rateLimitResponse = await RateLimitService.check(authResult.userId!, 'v1');
    if (rateLimitResponse) return rateLimitResponse;

    const [dbConnection] = await db.select().from(connectedDatabases).where(and(eq(connectedDatabases.id, dbId), eq(connectedDatabases.userId, authResult.userId!)));
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
        taskCategory: TaskCategory.STRUCTURED,
        maxTokens: 4000,
        responseFormatJson: true,
        providerConfig
      },
      process.env.GEMINI_API_KEY || "dummy", 
      undefined
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
        endpoint: `/v1/db/${(await params).dbId}/documentation`,
        resourceType: 'db',
        resourceId: parseInt((await params).dbId, 10),
        status: error instanceof ValidationError ? 400 : 500,
        durationMs,
        metrics
      });
    }
    return safeErrorResponse(error, 'V1 DB Documentation Extraction');
  }
}
