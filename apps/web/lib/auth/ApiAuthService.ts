import { eq, and } from 'drizzle-orm';
import { db } from '../../db';
import { apiKeys, apiUsageLogs, profiles, apiUsageCounters } from '../../db/schema';
import crypto from 'crypto';
import { sql } from 'drizzle-orm';

export type RequiredScope = 'kb:read' | 'kb:write' | 'db:query' | 'mcp:execute';

export interface AuthResult {
  isValid: boolean;
  apiKeyId?: number;
  userId?: string;
  error?: string;
}

export class ApiAuthService {
  private static hashKey(rawKey: string): string {
    return crypto.createHash('sha256').update(rawKey).digest('hex');
  }

  static async validateRequest(
    authHeader: string | null,
    requiredScope: RequiredScope,
    resourceType: 'kb' | 'db' | 'mcp',
    resourceId: number
  ): Promise<AuthResult> {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { isValid: false, error: 'Missing or invalid Authorization header' };
    }

    const rawKey = authHeader.split(' ')[1];
    if (!rawKey) {
      return { isValid: false, error: 'Missing token' };
    }

    const keyHash = this.hashKey(rawKey);

    // 1. Find the key
    const [keyRecord] = await db
      .select()
      .from(apiKeys)
      .where(and(eq(apiKeys.keyHash, keyHash), eq(apiKeys.status, 'active')));

    if (!keyRecord || !keyRecord.userId) {
      return { isValid: false, error: 'Invalid or revoked API key' };
    }

    if (keyRecord.expiresAt && new Date(keyRecord.expiresAt) < new Date()) {
      return { isValid: false, error: 'API key expired' };
    }

    // 2. Validate Operation Scope (e.g. 'kb:read')
    const scopes = (keyRecord.scopes as string[]) || [];
    if (!scopes.includes(requiredScope) && !scopes.includes('*')) {
      return { isValid: false, error: `Missing required scope: ${requiredScope}` };
    }

    // 3. Validate Resource Scope (e.g. {"kb": [12, 18]})
    const resourceScopes = keyRecord.resourceScopes as Record<string, number[]> | null;
    
    if (!resourceScopes) {
      return { isValid: false, error: 'Resource scopes are missing; access denied.' };
    }

    const allowedIds = resourceScopes[resourceType];
    if (!allowedIds || (!allowedIds.includes(resourceId) && !allowedIds.includes('*' as any))) {
      return { isValid: false, error: `Key does not have access to ${resourceType} ID ${resourceId}` };
    }

    // 4. Validate Quota Enforcements
    const { EntitlementEngine } = await import('../billing/entitlements');
    const limitCheck = await EntitlementEngine.checkLimit({ userId: keyRecord.userId, resource: 'ai_credits', incrementAmount: 1 });
    if (!limitCheck.allowed) {
      return { isValid: false, error: limitCheck.reason || 'Quota Exceeded: Too many requests this month.' };
    }

    // 5. Update last used (debounced to 60 minutes to reduce DB load)
    const sixtyMinutesAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (!keyRecord.lastUsedAt || new Date(keyRecord.lastUsedAt) < sixtyMinutesAgo) {
      // Run asynchronously so we don't block the API request
      db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, keyRecord.id)).catch(console.error);
    }

    return {
      isValid: true,
      apiKeyId: keyRecord.id,
      userId: keyRecord.userId,
    };
  }

  static async logUsage(params: {
    userId: string;
    apiKeyId?: number;
    endpoint: string;
    resourceType?: string;
    resourceId?: number;
    status: number;
    durationMs: number;
    metrics: {
      requests?: number;
      llm_tokens?: number;
      embedding_tokens?: number;
      vector_searches?: number;
      db_queries?: number;
      artifacts_generated?: number;
      automation_executions?: number;
    };
  }) {
    try {
      // 1. Consume from CreditService
      const { CreditService } = await import('../billing/CreditService');
      const requestsToConsume = params.metrics.requests || 1;
      const idempotencyKey = `api_${params.userId}_${Date.now()}`;
      
      const reserveResult = await CreditService.reserve(params.userId, 'developer_api', {
        requestId: idempotencyKey,
        multiplier: requestsToConsume,
        billingMode: 'developer_api'
      });
      
      if (reserveResult.success && reserveResult.usageId) {
        await CreditService.finalize(reserveResult.usageId, {
           inputTokens: params.metrics.llm_tokens || 0,
           embeddingTokens: params.metrics.embedding_tokens || 0
        });
      }
      await db.insert(apiUsageLogs).values({
        userId: params.userId,
        apiKeyId: params.apiKeyId,
        endpoint: params.endpoint,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        status: params.status,
        durationMs: params.durationMs,
        metrics: params.metrics,
      });
    } catch (error) {
      console.error('Failed to log API usage:', error);
    }
  }
}
