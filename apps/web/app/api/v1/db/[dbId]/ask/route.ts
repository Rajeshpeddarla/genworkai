import { NextResponse } from 'next/server';
import { db } from '../../../../../../db';
import { connectedDatabases, databaseSchemas, databaseQueryLogs } from '../../../../../../db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { z } from 'zod';
import { ApiAuthService } from '../../../../../../lib/auth/ApiAuthService';
import { safeErrorResponse, ValidationError } from '../../../../../../lib/errors';
import { DatabaseService, DBConnectionConfig } from '../../../../../../lib/database/DatabaseService';
import { generateWithFallbacks, TaskCategory } from '@repo/ai';
import { AiRoutingService } from '../../../../../../lib/ai/AiRoutingService';
import { decryptSecret } from '../../../../../../lib/security/encryption';
import { RateLimitService } from '../../../../../../lib/security/rate-limit';

const askSchema = z.object({
  question: z.string().min(1, 'Question is required'),
  execute: z.boolean().default(true),
});

export async function POST(req: Request, { params }: { params: Promise<{ dbId: string }> }) {
  const startTime = Date.now();
  let authResult;
  let metrics = { requests: 1, db_queries: 0, llm_tokens: 0 };
  let generatedSql = '';

  try {
    const p = await params;
    const dbIdStr = p.dbId;
    const dbId = parseInt(dbIdStr, 10);
    if (isNaN(dbId)) {
      throw new ValidationError('Invalid Database ID');
    }

    // 1. Authenticate
    const authHeader = req.headers.get('authorization');
    authResult = await ApiAuthService.validateRequest(authHeader, 'db:query', 'db', dbId);
    
    if (!authResult.isValid) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    // 2. Validate payload
    const body = await req.json().catch(() => ({}));
    const parsed = askSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.issues }, { status: 400 });
    }
    const { question, execute } = parsed.data;

    // 3. Get DB connection & cached schema
    const [dbConnection] = await db.select().from(connectedDatabases).where(and(eq(connectedDatabases.id, dbId), eq(connectedDatabases.userId, authResult.userId!)));
    if (!authResult.isValid) {
      throw new ValidationError(authResult.error || 'Unauthorized');
    }

    const rateLimitResponse = await RateLimitService.check(authResult.userId!, 'v1');
    if (rateLimitResponse) return rateLimitResponse;

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

    // 5. Generate SQL
    const systemPrompt = `You are an expert SQL assistant for a ${dbConnection.engine} database.
Given the following database schema, generate a safe, READ-ONLY SQL query to answer the user's question.
Return ONLY a JSON object matching this schema:
{
  "sql": "SELECT ...",
  "explanation": "Brief explanation of how the query works"
}

Schema:
${JSON.stringify(cachedSchema.schemaData, null, 2)}
`;

    const llmRes = await generateWithFallbacks(
      {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question }
        ],
        taskCategory: TaskCategory.REASONING,
        responseFormatJson: true,
        maxTokens: 2000,
        providerConfig
      },
      process.env.DEEPSEEK_API_KEY || "dummy", 
      process.env.DEEPSEEK_API_URL
    );

    metrics.llm_tokens += Math.floor((systemPrompt.length + question.length + llmRes.content.length) / 4);

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(llmRes.content);
    } catch (e) {
      throw new Error("LLM failed to return a valid JSON object.");
    }

    generatedSql = parsedResponse.sql;
    if (!generatedSql) {
      throw new Error('LLM failed to generate a SQL query.');
    }

    let results = null;
    let executionTimeMs = 0;
    let rowCount = 0;
    let executionError = null;

    // 5. Execute SQL if requested
    if (execute) {
      metrics.db_queries += 1;
      const dbService = new DatabaseService({
        engine: dbConnection.engine as DBConnectionConfig['engine'],
        connectionString: dbConnection.connectionString ? decryptSecret(dbConnection.connectionString) : undefined,
        host: dbConnection.host || undefined,
        port: dbConnection.port || undefined,
        database: dbConnection.databaseName || undefined,
        username: dbConnection.username || undefined,
        password: dbConnection.password ? decryptSecret(dbConnection.password) : undefined,
      });

      const execStart = Date.now();
      try {
        results = await dbService.executeQuery(generatedSql);
        rowCount = Array.isArray(results) ? results.length : (Array.isArray(results?.[0]) ? results[0].length : 0);
      } catch (e: any) {
        // Generate a correlation ID
        const correlationId = Math.random().toString(36).substring(2, 10);
        // Log the real error internally for debugging, but scrub it for the user
        console.error(`[DB Ask Execution Error] [${correlationId}]`, e.message || e);
        executionError = `Execution failed (Error ID: ${correlationId}). Please check the SQL logic and database connection.`;
        throw new ValidationError(executionError);
      } finally {
        executionTimeMs = Date.now() - execStart;
      }
    }

    // 6. Log the query
    await db.insert(databaseQueryLogs).values({
      userId: authResult.userId!,
      databaseId: dbId,
      question,
      generatedSql,
      executionTimeMs: execute ? executionTimeMs : null,
      rowCount: execute ? rowCount : null,
      success: !executionError,
      error: executionError,
    });

    // 7. Log API usage
    const durationMs = Date.now() - startTime;
    ApiAuthService.logUsage({
      userId: authResult.userId!,
      apiKeyId: authResult.apiKeyId,
      endpoint: `/v1/db/${dbId}/ask`,
      resourceType: 'db',
      resourceId: dbId,
      status: 200,
      durationMs,
      metrics
    });

    return NextResponse.json({
      sql: generatedSql,
      explanation: parsedResponse.explanation,
      executed: execute,
      results
    });

  } catch (error: unknown) {
    // If it failed, we still want to log the query attempt if we got SQL
    if (authResult?.isValid && generatedSql) {
      await db.insert(databaseQueryLogs).values({
        userId: authResult.userId!,
        databaseId: parseInt((await params).dbId, 10),
        question: typeof (error as any)?.question === 'string' ? (error as any).question : 'Unknown',
        generatedSql,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }).catch(console.error);
    }

    const durationMs = Date.now() - startTime;
    if (authResult?.isValid) {
      ApiAuthService.logUsage({
        userId: authResult.userId!,
        apiKeyId: authResult.apiKeyId,
        endpoint: `/v1/db/${(await params).dbId}/ask`,
        resourceType: 'db',
        resourceId: parseInt((await params).dbId, 10),
        status: error instanceof ValidationError ? 400 : 500,
        durationMs,
        metrics
      });
    }
    return safeErrorResponse(error, 'V1 DB Ask');
  }
}
