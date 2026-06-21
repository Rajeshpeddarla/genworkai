import { NextResponse } from 'next/server';
import { db } from '../../../../../db';
import { apiKeys } from '../../../../../db/schema';
import { requireUser } from '../../../../../lib/auth';
import { eq, and } from 'drizzle-orm';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, error } = await requireUser();
    if (error) return error;

    const { id } = await params;
    const keyId = parseInt(id, 10);
    if (isNaN(keyId)) {
      return NextResponse.json({ error: 'Invalid Key ID' }, { status: 400 });
    }

    // Hard delete the API key, or you could do a soft delete (status = 'revoked')
    const result = await db.delete(apiKeys).where(
      and(
        eq(apiKeys.id, keyId),
        eq(apiKeys.userId, user.id)
      )
    ).returning();

    if (result.length === 0) {
      return NextResponse.json({ error: 'Key not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Revoke API Key Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to revoke API key' }, { status: 500 });
  }
}
