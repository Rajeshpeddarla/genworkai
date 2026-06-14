import { NextResponse } from 'next/server';
import { db } from '../../../../db';
import { workspaceChats } from '../../../../db/schema';
import { desc } from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    const chats = await db.select()
      .from(workspaceChats)
      .orderBy(desc(workspaceChats.updatedAt));

    return NextResponse.json({ success: true, chats });
  } catch (error: any) {
    console.error("Failed to fetch chats:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { title, kbId } = await req.json();

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const newChat = await db.insert(workspaceChats).values({
      title,
      kbId: kbId || null,
    }).returning();

    return NextResponse.json({ success: true, chat: newChat[0] });
  } catch (error: any) {
    console.error("Failed to create chat:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
