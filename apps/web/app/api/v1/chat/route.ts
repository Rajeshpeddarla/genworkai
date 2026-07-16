import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { ApiAuthService } from '@/lib/auth/ApiAuthService';
import { RateLimitService } from '@/lib/security/rate-limit';
import { safeErrorResponse, ValidationError } from '@/lib/errors';
import { generateWithFallbacks, TaskCategory } from '@repo/ai';
import { AiRoutingService } from '@/lib/ai/AiRoutingService';

export async function POST(req: Request) {
  const startTime = Date.now();
  let authResult;
  let metrics = { requests: 1, llm_tokens: 0 };

  try {
    const authHeader = req.headers.get('authorization');
    authResult = await ApiAuthService.validateRequest(authHeader, 'kb:read', 'kb', 0);
    
    if (!authResult.isValid) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const rateLimitResponse = await RateLimitService.check(authResult.userId!, 'v1');
    if (rateLimitResponse) return rateLimitResponse;

    const body = await req.json().catch(() => ({}));
    if (!body.messages || !Array.isArray(body.messages)) {
      throw new ValidationError('A valid "messages" array is required.');
    }

    const providerConfig = await AiRoutingService.resolveProviderForUser(authResult.userId!, 'workspace');
    const res = await generateWithFallbacks({
      messages: body.messages,
      taskCategory: TaskCategory.FAST,
      maxTokens: body.maxTokens || 2000,
      providerConfig
    }, process.env.GEMINI_API_KEY || "dummy", undefined);

    metrics.llm_tokens += res.usage?.totalTokens || 0;

    const durationMs = Date.now() - startTime;
    ApiAuthService.logUsage({
      userId: authResult.userId!,
      apiKeyId: authResult.apiKeyId,
      endpoint: '/v1/chat',
      resourceType: 'api',
      resourceId: 0,
      status: 200,
      durationMs,
      metrics
    });

    return NextResponse.json({
      id: crypto.randomUUID(),
      model: res.model,
      choices: [{ message: { role: 'assistant', content: res.content } }],
      usage: res.usage
    });

  } catch (error: unknown) {
    const durationMs = Date.now() - startTime;
    if (authResult?.isValid) {
      ApiAuthService.logUsage({
        userId: authResult.userId!,
        apiKeyId: authResult.apiKeyId,
        endpoint: '/v1/chat',
        resourceType: 'api',
        resourceId: 0,
        status: error instanceof ValidationError ? 400 : 500,
        durationMs,
        metrics
      });
    }
    return safeErrorResponse(error, 'V1 Chat API');
  }
}
