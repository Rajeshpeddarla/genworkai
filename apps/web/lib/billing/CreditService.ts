import { db } from '../../db';
import { aiCreditLedger, aiUsage } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { UsageService } from './UsageService';

export interface ReserveOptions {
  workspaceId?: number;
  featureCategory?: string;
  endpoint?: string;
  artifactType?: string;
  billingMode?: 'platform' | 'byok' | 'developer_api';
  isByok?: boolean;
  requestId?: string;
  correlationId?: string;
  multiplier?: number;
}

export interface FinalizeOptions {
  inputTokens?: number;
  outputTokens?: number;
  embeddingTokens?: number;
  rerankerTokens?: number;
  provider?: string;
  model?: string;
  providerCost?: number;
  actualCredits?: number; // If overriding the estimated credits
}

export class CreditService {

  /**
   * Estimates and reserves credits for an operation.
   * If BYOK is enabled, skips deduction and reserving, but creates the ai_usage record.
   */
  static async reserve(
    userId: string,
    operationKey: string,
    options: ReserveOptions = {}
  ): Promise<{ success: boolean; reason?: string; usageId?: number; reservedCredits?: number; errorType?: string }> {
    
    const isByok = options.isByok || options.billingMode === 'byok';
    const multiplier = options.multiplier || 1;

    // 1. BYOK bypass
    if (isByok) {
      const [insertedUsage] = await db.insert(aiUsage).values({
        userId,
        workspaceId: options.workspaceId,
        operation: operationKey,
        featureCategory: options.featureCategory,
        endpoint: options.endpoint,
        artifactType: options.artifactType,
        billingMode: 'byok',
        isByok: true,
        requestId: options.requestId,
        correlationId: options.correlationId,
        estimatedCredits: 0,
        reservedCredits: 0,
        status: 'reserved',
        reservationStatus: 'reserved'
      }).returning();
      
      return { success: true, usageId: insertedUsage?.id, reservedCredits: 0 };
    }

    // 2. Platform/Developer API Reservation
    const estimatedCredits = (await UsageService.previewConsumption(operationKey)) * multiplier;

    // Check and deduct balance temporarily
    const usageResult = await UsageService.consumeCredits(userId, operationKey, multiplier, options.workspaceId);

    if (!usageResult.success) {
      return { 
        success: false, 
        reason: usageResult.reason, 
        errorType: usageResult.reason?.includes("Insufficient") ? 'INSUFFICIENT_AI_CREDITS' : 'SYSTEM_ERROR'
      };
    }

    const reservedCredits = usageResult.creditsUsed || 0;

    // 3. Write to Ledger
    if (reservedCredits > 0) {
      try {
        await db.insert(aiCreditLedger).values({
          userId,
          amount: -reservedCredits,
          type: 'consume',
          operationKey,
          description: `Reserved ${reservedCredits} credits for ${operationKey}`
        });
      } catch (e) {
        console.error("Failed to write to AI Credit Ledger:", e);
      }
    }

    // 4. Create ai_usage record
    const [insertedUsage] = await db.insert(aiUsage).values({
      userId,
      workspaceId: options.workspaceId,
      operation: operationKey,
      featureCategory: options.featureCategory,
      endpoint: options.endpoint,
      artifactType: options.artifactType,
      billingMode: options.billingMode || 'platform',
      isByok: false,
      requestId: options.requestId,
      correlationId: options.correlationId,
      estimatedCredits,
      reservedCredits,
      status: 'reserved',
      reservationStatus: 'reserved'
    }).returning();

    return { success: true, usageId: insertedUsage?.id, reservedCredits };
  }

  /**
   * Finalizes an AI usage record, logging token counts, and refunding any unused reserved credits.
   */
  static async finalize(
    usageId: number,
    options: FinalizeOptions = {}
  ): Promise<{ success: boolean }> {
    const record = await db.query.aiUsage.findFirst({ where: eq(aiUsage.id, usageId) });
    if (!record) return { success: false };

    // Set actual credits (if not provided, defaults to the reserved amount since we don't do fractional token billing)
    let actualCredits = options.actualCredits !== undefined ? options.actualCredits : record.reservedCredits;

    if (record.isByok) {
      actualCredits = 0; // BYOK never consumes credits
    } else {
      // Calculate refund
      const refundAmount = (record.reservedCredits || 0) - (actualCredits || 0);
      
      if (refundAmount > 0) {
        await UsageService.addPurchasedCredits(record.userId, refundAmount);
        
        // Ledger entry for refund
        await db.insert(aiCreditLedger).values({
          userId: record.userId,
          amount: refundAmount,
          type: 'refund',
          operationKey: record.operation,
          description: `Refunded ${refundAmount} unused reserved credits for ${record.operation}`
        });
      }
    }

    await db.update(aiUsage).set({
      status: 'completed',
      reservationStatus: 'finalized',
      inputTokens: options.inputTokens || 0,
      outputTokens: options.outputTokens || 0,
      embeddingTokens: options.embeddingTokens || 0,
      rerankerTokens: options.rerankerTokens || 0,
      provider: options.provider,
      model: options.model,
      providerCost: options.providerCost ? String(options.providerCost) : undefined,
      actualCredits,
      updatedAt: new Date()
    }).where(eq(aiUsage.id, usageId));

    return { success: true };
  }

  /**
   * Refunds a reserved AI usage entirely (e.g. if the API call failed).
   */
  static async refund(usageId: number, failureReason?: string): Promise<{ success: boolean }> {
    const record = await db.query.aiUsage.findFirst({ where: eq(aiUsage.id, usageId) });
    if (!record) return { success: false };

    if (!record.isByok && (record.reservedCredits || 0) > 0) {
      await UsageService.addPurchasedCredits(record.userId, record.reservedCredits!);
      
      await db.insert(aiCreditLedger).values({
        userId: record.userId,
        amount: record.reservedCredits!,
        type: 'refund',
        operationKey: record.operation,
        description: `Refunded ${record.reservedCredits} credits due to failure: ${record.operation}`
      });
    }

    await db.update(aiUsage).set({
      status: 'failed',
      reservationStatus: 'refunded',
      failureReason,
      actualCredits: 0,
      updatedAt: new Date()
    }).where(eq(aiUsage.id, usageId));

    return { success: true };
  }

  // Legacy grant (kept for Admin API usage)
  static async grant(
    userId: string,
    amount: number,
    type: 'purchase' | 'refill' | 'grant' | 'refund',
    description: string,
    idempotencyKey?: string
  ): Promise<{ success: boolean }> {
    if (amount <= 0) return { success: true };

    if (idempotencyKey) {
      const existingTx = await db.query.aiCreditLedger.findFirst({
        where: eq(aiCreditLedger.idempotencyKey, idempotencyKey)
      });
      if (existingTx) return { success: true };
    }

    if (type !== 'refill') {
      await UsageService.addPurchasedCredits(userId, amount);
    }

    await db.insert(aiCreditLedger).values({
      userId,
      amount: amount,
      type,
      idempotencyKey: idempotencyKey || null,
      description
    });

    return { success: true };
  }
}
