import { NextResponse } from 'next/server';
import { db } from '../../../../db';
import { documents } from '../../../../db/schema';
import { eq } from 'drizzle-orm';
import { requireUser, requireOwnership } from '../../../../lib/auth';
import { safeErrorResponse, ValidationError } from '../../../../lib/errors';

export async function POST(req: Request) {
  try {
    const { user, error } = await requireUser();
    if (error) return error;
    const { id } = await req.json();
    if (!id) throw new ValidationError('Document ID required');

    // Verify ownership via document -> kbId
    const targetDoc = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
    if (!targetDoc || targetDoc.length === 0) {
      throw new ValidationError('Document not found');
    }

    if (targetDoc[0]!.kbId) {
      const ownershipError = await requireOwnership('knowledge_base', targetDoc[0]!.kbId, user.id);
      if (ownershipError) return ownershipError;
    }

    await db.delete(documents).where(eq(documents.id, id));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return safeErrorResponse(error, 'Delete Document Route');
  }
}
