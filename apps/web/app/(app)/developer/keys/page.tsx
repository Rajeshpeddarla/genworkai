import { createClient } from '../../../../utils/supabase/server';
import { db } from '../../../../db';
import { apiKeys } from '../../../../db/schema';
import { eq, and } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import KeysManager from './KeysManager';
import { EntitlementEngine } from '../../../../lib/billing/entitlements';

export default async function DeveloperKeysPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  // 1. Get all keys for UI list (active and revoked)
  const keys = await db.select().from(apiKeys).where(eq(apiKeys.userId, session.user.id)).orderBy(apiKeys.createdAt);
  const serializedKeys = JSON.parse(JSON.stringify(keys));

  // 2. Fetch Entitlements for UI rendering
  const featureCheck = await EntitlementEngine.hasFeature(session.user.id, 'api_access');
  const limitCheck = await EntitlementEngine.checkLimit({ userId: session.user.id, resource: 'api_keys', incrementAmount: 0 }); // incrementAmount 0 to just read

  return (
    <div className="p-8 max-w-5xl">
      <KeysManager 
        initialKeys={serializedKeys} 
        entitlements={{
          hasApiAccess: featureCheck.allowed,
          apiAccessReason: featureCheck.reason,
          keysLimit: limitCheck.limit || 0,
          currentKeyCount: limitCheck.currentUsage || 0,
          upgradeRequired: featureCheck.upgradeRequired || limitCheck.upgradeRequired
        }}
      />
    </div>
  );
}
