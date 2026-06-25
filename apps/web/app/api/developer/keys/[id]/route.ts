import { NextResponse } from 'next/server';
import { db } from '../../../../../db';
import { apiKeys, auditLogs } from '../../../../../db/schema';
import { requireUser } from '../../../../../lib/auth';
import { eq, and } from 'drizzle-orm';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, error } = await requireUser();
    if (error) return error;

    const { id } = await params;
    const keyId = parseInt(id, 10);
    if (isNaN(keyId)) {
      return NextResponse.json({ 
        code: 'INVALID_ID',
        error: 'Invalid Key ID' 
      }, { status: 400 });
    }

    // Soft delete the API key by setting status to 'revoked'
    // This removes it from the active quota count
    const result = await db.update(apiKeys)
      .set({ status: 'revoked' })
      .where(
        and(
          eq(apiKeys.id, keyId),
          eq(apiKeys.userId, user.id)
        )
      ).returning();

    if (result.length === 0) {
      return NextResponse.json({ 
        code: 'NOT_FOUND',
        error: 'Key not found or unauthorized' 
      }, { status: 404 });
    }

    const revokedKey = result[0]!;

    // Audit Log
    await db.insert(auditLogs).values({
      userId: user.id,
      action: 'api_key_revoked',
      resourceType: 'api_key',
      resourceId: revokedKey.id,
      metadata: { name: revokedKey.name, prefix: revokedKey.keyPrefix }
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Revoke API Key Error:', error);
    return NextResponse.json({ 
      code: 'INTERNAL_ERROR',
      error: error.message || 'Failed to revoke API key' 
    }, { status: 500 });
  }
}
