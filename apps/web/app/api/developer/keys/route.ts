import { NextResponse } from 'next/server';
import { db } from '../../../../db';
import { apiKeys } from '../../../../db/schema';
import { requireUser } from '../../../../lib/auth';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { user, error } = await requireUser();
    if (error) return error;

    const { name, scopes } = await req.json();

    // Generate secure API key
    const rawKey = `gwa_${crypto.randomBytes(32).toString('base64url').replace(/[-_]/g, '')}`;
    const keyPrefix = rawKey.substring(0, 10);
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    const newKey = await db.insert(apiKeys).values({
      userId: user.id,
      name: name || 'Default API Key',
      keyPrefix,
      keyHash,
      scopes: scopes && scopes.length > 0 ? scopes : ['kb:read', 'db:query'],
      resourceScopes: {}, // Empty by default for security
      status: 'active',
      expiresAt: null
    }).returning();

    // The rawKey is ONLY returned once and never stored
    return NextResponse.json({ success: true, key: newKey[0], rawKey });

  } catch (error: any) {
    console.error('Create API Key Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create API key' }, { status: 500 });
  }
}
