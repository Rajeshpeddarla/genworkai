import { NextResponse } from 'next/server';
import { db } from '../../../../db';
import { apiKeys, auditLogs } from '../../../../db/schema';
import { requireUser } from '../../../../lib/auth';
import { EntitlementEngine } from '../../../../lib/billing/entitlements';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { user, error } = await requireUser();
    
    // Check for demo mode bypass
    const isDemo = req.headers.get('cookie')?.includes('frontend_auth');
    if (error && !isDemo) return error;

    // Entitlement Check: Feature Access
    if (!isDemo) {
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const featureCheck = await EntitlementEngine.hasFeature(user.id, 'api_access');
      if (!featureCheck.allowed) {
        return NextResponse.json({
          code: featureCheck.code,
          message: featureCheck.reason,
          upgradeRequired: featureCheck.upgradeRequired
        }, { status: 403 });
      }

      // Entitlement Check: API Key Limit
      const limitCheck = await EntitlementEngine.checkLimit({ userId: user.id, resource: 'api_keys' });
      if (!limitCheck.allowed) {
        return NextResponse.json({
          code: limitCheck.code,
          message: limitCheck.reason,
          limit: limitCheck.limit,
          current: limitCheck.currentUsage,
          upgradeRequired: limitCheck.upgradeRequired
        }, { status: 403 });
      }
    }

    const { name, scopes } = await req.json();

    // Generate secure API key
    const rawKey = `gwa_${crypto.randomBytes(32).toString('base64url').replace(/[-_]/g, '')}`;
    const keyPrefix = rawKey.substring(0, 10);
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    // If demo mode, don't insert into DB, just return fake key
    if (isDemo && error) {
      return NextResponse.json({ 
        success: true, 
        key: {
          id: Math.floor(Math.random() * 10000),
          userId: 'demo-user',
          name: name || 'Demo API Key',
          keyPrefix,
          scopes: scopes && scopes.length > 0 ? scopes : ['kb:read', 'db:query'],
          status: 'active',
          createdAt: new Date().toISOString()
        }, 
        rawKey 
      });
    }

    const newKey = await db.insert(apiKeys).values({
      userId: user!.id,
      name: name || 'Default API Key',
      keyPrefix,
      keyHash,
      scopes: scopes && scopes.length > 0 ? scopes : ['kb:read', 'db:query'],
      resourceScopes: {}, // Empty by default for security
      status: 'active',
      expiresAt: null
    }).returning();

    const createdKey = newKey[0]!;

    // Audit Log
    await db.insert(auditLogs).values({
      userId: user!.id,
      action: 'api_key_created',
      resourceType: 'api_key',
      resourceId: createdKey.id,
      metadata: { name: createdKey.name, prefix: keyPrefix }
    });

    // The rawKey is ONLY returned once and never stored
    return NextResponse.json({ success: true, key: createdKey, rawKey });

  } catch (error: any) {
    console.error('Create API Key Error:', error);
    return NextResponse.json({ 
      code: 'INTERNAL_ERROR',
      message: error.message || 'Failed to create API key' 
    }, { status: 500 });
  }
}
