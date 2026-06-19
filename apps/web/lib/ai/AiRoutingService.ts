import { db } from '../../db';
import { userLlmKeys, aiProfiles } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { EncryptionUtil } from '../utils/encryption';
import { ProviderConfig } from '@repo/ai';

export class AiRoutingService {
  static async resolveProviderForUser(
    userId: string,
    context: 'workspace' | 'knowledge' | 'database' | 'automation'
  ): Promise<ProviderConfig | undefined> {
    // 1. Get user's AI profile preference
    const [profile] = await db.select().from(aiProfiles).where(eq(aiProfiles.userId, userId));
    
    let keyId: number | null = null;
    
    if (profile) {
      if (context === 'workspace') keyId = profile.workspaceModelId;
      else if (context === 'knowledge') keyId = profile.knowledgeModelId;
      else if (context === 'database') keyId = profile.databaseModelId;
      else if (context === 'automation') keyId = profile.automationModelId;
    }

    // 2. Fetch the specific key, or fallback to the first active personal key
    let keyRecord;
    
    if (keyId) {
      [keyRecord] = await db.select().from(userLlmKeys).where(eq(userLlmKeys.id, keyId));
    } else {
      [keyRecord] = await db.select().from(userLlmKeys).where(eq(userLlmKeys.userId, userId)).limit(1);
    }

    if (!keyRecord) {
      return undefined; // No BYOK configured, use platform default
    }

    // 3. Decrypt and format for the AI package
    try {
      const decryptedKey = EncryptionUtil.decrypt(keyRecord.apiKey);
      return {
        provider: keyRecord.provider,
        apiKey: decryptedKey,
        baseUrl: keyRecord.baseUrl || undefined,
        defaultModel: keyRecord.defaultModel || undefined,
      };
    } catch (e) {
      console.error(`Failed to decrypt API key for user ${userId}:`, e);
      return undefined;
    }
  }
}
