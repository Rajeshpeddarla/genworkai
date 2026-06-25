import { db } from '../../db';
import { 
  subscriptionPlans, 
  userSubscriptions, 
  usageCounters, 
  profiles,
  apiKeys,
  knowledgeBases,
  connectedDatabases
} from '../../db/schema';
import { eq, and, sql } from 'drizzle-orm';

export interface EntitlementResult {
  allowed: boolean;
  reason?: string;
  currentUsage?: number;
  limit?: number;
  code?: string;
  upgradeRequired?: boolean;
}

export type FeatureType = 
  | 'api_access'
  | 'mcp_access'
  | 'automation_access'
  | 'knowledge_base_access'
  | 'database_access'
  | 'byok'
  | 'priority_support';

export type ResourceType = 
  | 'api_keys'
  | 'knowledge_bases'
  | 'database_connections'
  | 'api_requests'
  | 'mcp_servers'
  | 'mcp_tools'
  | 'mcp_requests'
  | 'workspaces'
  | 'automations'
  | 'context_size';

const FEATURE_MAP: Record<FeatureType, keyof typeof subscriptionPlans.$inferSelect> = {
  api_access: 'apiAccessEnabled',
  mcp_access: 'mcpEnabled',
  automation_access: 'automationStudioEnabled',
  knowledge_base_access: 'knowledgeBaseEnabled',
  database_access: 'databaseIntelligenceEnabled',
  byok: 'byokEnabled',
  priority_support: 'prioritySupportEnabled',
};

const RESOURCE_LIMIT_MAP: Record<ResourceType, keyof typeof subscriptionPlans.$inferSelect> = {
  api_keys: 'apiKeyLimit',
  knowledge_bases: 'knowledgeBaseLimit',
  database_connections: 'databaseLimit',
  api_requests: 'apiRequestLimit',
  mcp_servers: 'mcpServerLimit',
  mcp_tools: 'mcpToolLimit',
  mcp_requests: 'mcpRequestLimit',
  workspaces: 'workspaceLimit',
  automations: 'automationLimit',
  context_size: 'contextLimit',
};

export class EntitlementEngine {
  
  /**
   * Checks if a user has access to a specific premium capability (feature flag)
   */
  static async hasFeature(userId: string, feature: FeatureType): Promise<EntitlementResult> {
    // 1. Admin Override
    const profile = await db.query.profiles.findFirst({ where: eq(profiles.id, userId) });
    if (profile?.isAdmin) {
      return { allowed: true };
    }

    const featureKey = FEATURE_MAP[feature];
    if (!featureKey) {
      return { allowed: false, code: 'UNKNOWN_FEATURE', reason: `Unknown feature: ${feature}` };
    }

    // 2. Resolve Plan
    const activeSub = await this.getActiveSubscription(userId);
    let plan;
    
    if (activeSub) {
      plan = await db.query.subscriptionPlans.findFirst({ where: eq(subscriptionPlans.id, activeSub.planId!) });
    } else {
      plan = await db.query.subscriptionPlans.findFirst({ where: eq(subscriptionPlans.slug, 'free') });
    }

    if (!plan || !plan[featureKey]) {
      return { 
        allowed: false, 
        code: `${feature.toUpperCase()}_DISABLED`,
        reason: `Your current subscription does not include ${feature.replace(/_/g, ' ')}.`,
        upgradeRequired: true
      };
    }

    return { allowed: true };
  }

  /**
   * Checks if a user is within their allowed limit for a quantifiable resource
   */
  static async checkLimit({ userId, resource, incrementAmount = 1 }: { userId: string, resource: ResourceType, incrementAmount?: number }): Promise<EntitlementResult> {
    // 1. Admin Override
    const profile = await db.query.profiles.findFirst({ where: eq(profiles.id, userId) });
    if (profile?.isAdmin) {
      return { allowed: true, currentUsage: 0, limit: -1 }; // -1 indicates unlimited
    }

    const limitKey = RESOURCE_LIMIT_MAP[resource];
    if (!limitKey) {
      return { allowed: false, code: 'UNKNOWN_RESOURCE', reason: `Unknown resource: ${resource}` };
    }

    // 2. Resolve Plan Limit
    const activeSub = await this.getActiveSubscription(userId);
    let plan;
    if (activeSub) {
      plan = await db.query.subscriptionPlans.findFirst({ where: eq(subscriptionPlans.id, activeSub.planId!) });
    } else {
      plan = await db.query.subscriptionPlans.findFirst({ where: eq(subscriptionPlans.slug, 'free') });
    }

    let limit = 0;
    if (plan && typeof plan[limitKey] === 'number') {
      limit = plan[limitKey] as number;
    }

    // Assume 0 means disabled / no allowance
    if (limit === 0) {
      return { 
        allowed: false, 
        code: `${resource.toUpperCase()}_DISABLED`,
        reason: `No allowance for ${resource.replace(/_/g, ' ')} on your current plan.`, 
        limit: 0, 
        currentUsage: 0,
        upgradeRequired: true
      };
    }

    // -1 can be explicitly set in DB to mean unlimited
    if (limit === -1) {
      return { allowed: true, limit: -1 };
    }

    // 3. Compute Current Usage Dynamically
    const currentUsage = await this.computeUsage(userId, resource);

    if (currentUsage + incrementAmount > limit) {
      return { 
        allowed: false, 
        code: `${resource.toUpperCase()}_LIMIT_REACHED`,
        reason: `Exceeded limit for ${resource.replace(/_/g, ' ')}.`,
        currentUsage,
        limit,
        upgradeRequired: true
      };
    }

    return { allowed: true, currentUsage, limit };
  }

  /**
   * Dynamically computes usage depending on whether the resource is absolute or monthly
   */
  private static async computeUsage(userId: string, resource: ResourceType): Promise<number> {
    const currentMonth = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
    
    switch (resource) {
      // --- Absolute Limits ---
      case 'api_keys': {
        const res = await db.select({ count: sql<number>`count(*)::int` })
          .from(apiKeys)
          .where(and(eq(apiKeys.userId, userId), eq(apiKeys.status, 'active')));
        return res[0]?.count || 0;
      }
      case 'knowledge_bases': {
        const res = await db.select({ count: sql<number>`count(*)::int` })
          .from(knowledgeBases)
          .where(eq(knowledgeBases.userId, userId));
        return res[0]?.count || 0;
      }
      case 'database_connections': {
        const res = await db.select({ count: sql<number>`count(*)::int` })
          .from(connectedDatabases)
          .where(eq(connectedDatabases.userId, userId));
        return res[0]?.count || 0;
      }
      
      // --- Monthly Limits (Usage Counters) ---
      case 'api_requests': {
        const record = await db.query.usageCounters.findFirst({
          where: and(eq(usageCounters.userId, userId), eq(usageCounters.month, currentMonth))
        });
        return record?.apiRequests || 0;
      }

      // --- Others (Default to 0 for MVP if unimplemented) ---
      default:
        return 0;
    }
  }

  /**
   * Helper to get a valid, active subscription
   */
  private static async getActiveSubscription(userId: string) {
    const sub = await db.query.userSubscriptions.findFirst({
      where: eq(userSubscriptions.userId, userId),
      orderBy: (subscriptions, { desc }) => [desc(subscriptions.createdAt)]
    });

    if (!sub) return null;

    const validStates = ['active', 'trialing', 'grace_period', 'cancelled'];
    
    if (validStates.includes(sub.status)) {
      if (sub.expiresAt && new Date() > sub.expiresAt) {
        return null;
      }
      return sub;
    }

    return null;
  }
}
