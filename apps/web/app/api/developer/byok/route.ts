import { NextResponse } from 'next/server';
import { db } from '../../../../db';
import { userLlmKeys } from '../../../../db/schema';
import { eq } from 'drizzle-orm';
import { createClient } from '../../../../utils/supabase/server';
import { EncryptionUtil } from '../../../../lib/utils/encryption';

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const keys = await db.select({
      id: userLlmKeys.id,
      provider: userLlmKeys.provider,
      baseUrl: userLlmKeys.baseUrl,
      defaultModel: userLlmKeys.defaultModel,
      scope: userLlmKeys.scope,
      status: userLlmKeys.status,
      lastValidatedAt: userLlmKeys.lastValidatedAt,
      lastError: userLlmKeys.lastError,
      createdAt: userLlmKeys.createdAt
    }).from(userLlmKeys).where(eq(userLlmKeys.userId, session.user.id));

    return NextResponse.json(keys);
  } catch (error: any) {
    console.error('Failed to get BYOK configs:', error);
    return NextResponse.json({ error: 'Failed to fetch BYOK configs' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    
    // Validate
    if (!body.provider || !body.apiKey) {
      return NextResponse.json({ error: 'Provider and API Key are required' }, { status: 400 });
    }

    const encryptedKey = EncryptionUtil.encrypt(body.apiKey);

    const [newKey] = await db.insert(userLlmKeys).values({
      userId: session.user.id,
      provider: body.provider,
      apiKey: encryptedKey,
      baseUrl: body.baseUrl,
      defaultModel: body.defaultModel,
      scope: body.scope || 'personal',
      status: 'active',
      lastValidatedAt: new Date(),
    }).returning();

    if (!newKey) {
      throw new Error("Failed to insert key");
    }

    // Do not return raw or encrypted API key
    return NextResponse.json({
      success: true,
      config: {
        id: newKey.id,
        provider: newKey.provider,
        baseUrl: newKey.baseUrl,
        defaultModel: newKey.defaultModel,
        status: newKey.status,
      }
    });

  } catch (error: any) {
    console.error('Failed to save BYOK config:', error);
    return NextResponse.json({ error: 'Failed to save config' }, { status: 500 });
  }
}
