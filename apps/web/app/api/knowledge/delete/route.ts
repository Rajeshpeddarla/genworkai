import { NextResponse } from 'next/server';
import { db } from '../../../../db';
import { knowledgeBases, documents, workspaceChats, knowledgeSources } from '../../../../db/schema';
import { eq } from 'drizzle-orm';
import { requireUser, requireOwnership } from '../../../../lib/auth';
import { safeErrorResponse, ValidationError } from '../../../../lib/errors';

export async function POST(req: Request) {
  try {
    const { user, error } = await requireUser();
    if (error) return error;
    const { id } = await req.json();
    if (!id) throw new ValidationError('Knowledge Base ID required');

    const ownershipError = await requireOwnership('knowledge_base', id, user.id);
    if (ownershipError) return ownershipError;

    // Manually delete related records to avoid foreign key constraint violations
    await db.delete(documents).where(eq(documents.kbId, id));
    await db.delete(workspaceChats).where(eq(workspaceChats.kbId, id));
    await db.delete(knowledgeSources).where(eq(knowledgeSources.kbId, id));
    
    // Finally delete the Knowledge Base itself
    await db.delete(knowledgeBases).where(eq(knowledgeBases.id, id));

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return safeErrorResponse(error, 'Delete Knowledge Base Route');
  }
}
