import { NextResponse } from 'next/server';
import { db } from '../../../../../../db';
import { knowledgeBases } from '../../../../../../db/schema';
import { sql, eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { ApiAuthService } from '../../../../../../lib/auth/ApiAuthService';
import { generateEmbedding } from '../../../../../../lib/embeddings';
import { generateWithFallbacks, TaskCategory } from '@repo/ai';
import { AiRoutingService } from '../../../../../../lib/ai/AiRoutingService';
import { RateLimitService } from '../../../../../../lib/security/rate-limit';
import { safeErrorResponse, ValidationError } from '../../../../../../lib/errors';
import { CreditService } from '../../../../../../lib/billing/CreditService';

const generateSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  outputType: z.enum(['summary', 'flashcards', 'report']),
});

export async function POST(req: Request, { params }: { params: Promise<{ kbId: string }> }) {
  const startTime = Date.now();
  let authResult;
  let metrics = { vector_searches: 0, requests: 1, llm_tokens: 0, artifacts_generated: 0 };
  let usageId: number | undefined;

  try {
    const p = await params;
    const kbIdStr = p.kbId;
    const kbId = parseInt(kbIdStr, 10);
    if (isNaN(kbId)) {
      throw new ValidationError('Invalid Knowledge Base ID');
    }

    // 1. Authenticate using the API Gateway Service
    const authHeader = req.headers.get('authorization');
    authResult = await ApiAuthService.validateRequest(authHeader, 'kb:read', 'kb', kbId);
    
    if (!authResult.isValid) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    // 2. Parse and Validate Payload
    const body = await req.json().catch(() => ({}));
    const parsed = generateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.issues }, { status: 400 });
    }
    const { prompt, outputType } = parsed.data;

    const rateLimitResponse = await RateLimitService.check(authResult.userId!, 'v1');
    if (rateLimitResponse) return rateLimitResponse;

    const idempotencyKey = req.headers.get('x-idempotency-key') || crypto.randomUUID();
    const operationKey = outputType === 'summary' ? 'summary_generation' : outputType === 'flashcards' ? 'flashcards_generation' : 'knowledge_chat';
    const reserveResult = await CreditService.reserve(authResult.userId!, operationKey, {
      requestId: idempotencyKey,
      endpoint: '/api/v1/kb/[kbId]/generate',
      billingMode: 'developer_api' // this is an API route
    });
    
    if (!reserveResult.success) {
      return NextResponse.json({ 
        error: reserveResult.reason || "Insufficient AI Credits.",
        code: reserveResult.errorType || 'INSUFFICIENT_AI_CREDITS'
      }, { status: 403 });
    }
    usageId = reserveResult.usageId;

    // 2.5 Verify ownership of Knowledge Base
    const [kb] = await db.select().from(knowledgeBases).where(and(eq(knowledgeBases.id, kbId), eq(knowledgeBases.userId, authResult.userId!)));
    if (!kb) {
      throw new ValidationError('Knowledge base not found or access denied');
    }

    // 3. Search for context based on the prompt
    const queryVector = await generateEmbedding(prompt);
    const queryVectorString = `[${queryVector.join(',')}]`;
    metrics.vector_searches += 1;

    const searchSql = sql`
      WITH vector_search AS (
        SELECT c.id, c.embedding <=> ${queryVectorString}::vector as distance,
               ROW_NUMBER() OVER (ORDER BY c.embedding <=> ${queryVectorString}::vector ASC) as vector_rank
        FROM document_chunks c
        JOIN documents d ON d.id = c.document_id
        WHERE d.kb_id = ${kbId}
        ORDER BY distance ASC
        LIMIT 15
      ),
      keyword_search AS (
        SELECT c.id, ts_rank(to_tsvector('english', c.content), plainto_tsquery('english', ${prompt})) as bm25_rank,
               ROW_NUMBER() OVER (ORDER BY ts_rank(to_tsvector('english', c.content), plainto_tsquery('english', ${prompt})) DESC) as keyword_rank
        FROM document_chunks c
        JOIN documents d ON d.id = c.document_id
        WHERE d.kb_id = ${kbId}
          AND to_tsvector('english', c.content) @@ plainto_tsquery('english', ${prompt})
        ORDER BY bm25_rank DESC
        LIMIT 15
      ),
      rrf AS (
        SELECT 
          COALESCE(v.id, k.id) as chunk_id,
          (COALESCE(1.0 / (60 + v.vector_rank), 0.0) +
           COALESCE(1.0 / (60 + k.keyword_rank), 0.0)) as rrf_score
        FROM vector_search v
        FULL OUTER JOIN keyword_search k ON v.id = k.id
      )
      SELECT 
        c.content,
        d.title as "documentTitle"
      FROM rrf r
      JOIN document_chunks c ON c.id = r.chunk_id
      JOIN documents d ON d.id = c.document_id
      ORDER BY r.rrf_score DESC
      LIMIT 10
    `;

    const { rows: contexts } = await db.execute(searchSql);
    const contextText = contexts.map(c => `[Source: ${c.documentTitle}]\n${c.content}`).join('\n\n');

    // 4. Generate Specific Output Type
    let schemaDefinition = '';
    if (outputType === 'summary') {
      schemaDefinition = `{ "summary": "Detailed summary", "key_points": ["point 1", "point 2"] }`;
    } else if (outputType === 'flashcards') {
      schemaDefinition = `{ "flashcards": [{"front": "Question/Term", "back": "Answer/Definition"}] }`;
    } else if (outputType === 'report') {
      schemaDefinition = `{ "title": "Report Title", "executive_summary": "...", "sections": [{"heading": "...", "content": "..."}] }`;
    }

    const systemPrompt = `You are an expert knowledge synthesizer. Given the retrieved context, generate the requested output type.
User Prompt: ${prompt}
You MUST return your response strictly as a JSON object matching this schema:
${schemaDefinition}`;

    // 5. Generate content using LLM
    const providerConfig = await AiRoutingService.resolveProviderForUser(authResult.userId!, 'knowledge');

    const llmRes = await generateWithFallbacks(
      {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Context:\n${contextText}` }
        ],
        taskCategory: TaskCategory.STRUCTURED,
        responseFormatJson: true,
        maxTokens: 3000,
        providerConfig
      },
      process.env.GEMINI_API_KEY || "dummy",
      undefined
    );

    metrics.llm_tokens += Math.floor((systemPrompt.length + contextText.length + llmRes.content.length) / 4);
    metrics.artifacts_generated += 1;

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(llmRes.content);
    } catch (e) {
      throw new Error("LLM failed to return a valid JSON object.");
    }

    if (usageId) {
      await CreditService.finalize(usageId, {
        provider: 'deepseek', // Note: assuming deepseek since generateWithFallbacks falls back to it, though technically could be dynamic
        inputTokens: Math.floor((systemPrompt.length + contextText.length) / 4),
        outputTokens: Math.floor(llmRes.content.length / 4)
      });
    }

    // 5. Log API usage asynchronously
    const durationMs = Date.now() - startTime;
    ApiAuthService.logUsage({
      userId: authResult.userId!,
      apiKeyId: authResult.apiKeyId,
      endpoint: `/v1/kb/${kbId}/generate`,
      resourceType: 'kb',
      resourceId: kbId,
      status: 200,
      durationMs,
      metrics
    });

    return NextResponse.json(parsedResponse);

  } catch (error: unknown) {
    if (usageId) {
      await CreditService.refund(usageId, error instanceof Error ? error.message : "Unknown error");
    }
    const durationMs = Date.now() - startTime;
    if (authResult?.isValid) {
      ApiAuthService.logUsage({
        userId: authResult.userId!,
        apiKeyId: authResult.apiKeyId,
        endpoint: `/v1/kb/${(await params).kbId}/generate`,
        resourceType: 'kb',
        resourceId: parseInt((await params).kbId, 10),
        status: error instanceof ValidationError ? 400 : 500,
        durationMs,
        metrics
      });
    }
    return safeErrorResponse(error, 'V1 Knowledge Generate');
  }
}
