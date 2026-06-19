import { NextResponse } from 'next/server';
import { db } from '../../../../../db';
import { workspaceChats, workspaceMessages } from '../../../../../db/schema';
import { eq, asc } from 'drizzle-orm';
import { requireUser, requireOwnership } from '../../../../../lib/auth';
import { safeErrorResponse } from '../../../../../lib/errors';

export async function GET(req: Request, { params }: { params: Promise<{ chatId: string }> }) {
  try {
    const { user, error: authError } = await requireUser();
    if (authError) return authError;

    const resolvedParams = await params;
    const chatId = parseInt(resolvedParams.chatId);
    if (isNaN(chatId)) {
      return NextResponse.json({ error: "Invalid chat ID" }, { status: 400 });
    }

    const ownershipError = await requireOwnership('chat', chatId, user.id);
    if (ownershipError) return ownershipError;

    const chat = await db.query.workspaceChats.findFirst({
      where: eq(workspaceChats.id, chatId)
    });

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    const messages = await db.select()
      .from(workspaceMessages)
      .where(eq(workspaceMessages.chatId, chatId))
      .orderBy(asc(workspaceMessages.createdAt));

    return NextResponse.json({ success: true, chat, messages });
  } catch (error: any) {
    console.error("Failed to fetch chat details:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ chatId: string }> }) {
  try {
    const { user, error: authError } = await requireUser();
    if (authError) return authError;

    const resolvedParams = await params;
    const chatId = parseInt(resolvedParams.chatId);
    if (isNaN(chatId)) {
      return NextResponse.json({ error: "Invalid chat ID" }, { status: 400 });
    }

    const ownershipError = await requireOwnership('chat', chatId, user.id);
    if (ownershipError) return ownershipError;

    await db.delete(workspaceChats).where(eq(workspaceChats.id, chatId));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete chat:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
