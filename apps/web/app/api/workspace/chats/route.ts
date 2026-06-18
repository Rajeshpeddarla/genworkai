import { NextResponse } from 'next/server';
import { db } from '../../../../db';
import { workspaceChats } from '../../../../db/schema';
import { desc, eq } from 'drizzle-orm';
import { requireUser, requireOwnership } from '../../../../lib/auth';
import { safeErrorResponse, ValidationError } from '../../../../lib/errors';

export async function GET(req: Request) {
  try {
    const { user, error } = await requireUser();
    if (error) return error;

    const chats = await db.select()
      .from(workspaceChats)
      .where(eq(workspaceChats.userId, user.id))
      .orderBy(desc(workspaceChats.updatedAt));

    return NextResponse.json({ success: true, chats });
  } catch (error: unknown) {
    return safeErrorResponse(error, 'Get Workspace Chats Route');
  }
}

export async function POST(req: Request) {
  try {
    const { user, error } = await requireUser();
    if (error) return error;

    const { title, kbId } = await req.json();

    if (!title) {
      throw new ValidationError("Title is required");
    }

    if (kbId) {
      const ownershipError = await requireOwnership('knowledge_base', kbId, user.id);
      if (ownershipError) return ownershipError;
    }

    const newChat = await db.insert(workspaceChats).values({
      title,
      kbId: kbId || null,
      userId: user.id,
    }).returning();

    return NextResponse.json({ success: true, chat: newChat[0] });
  } catch (error: unknown) {
    return safeErrorResponse(error, 'Create Workspace Chat Route');
  }
}
