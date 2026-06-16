import { NextResponse } from 'next/server';
import { db } from '../../../../db';
import { workspaceChats } from '../../../../db/schema';
import { desc, eq } from 'drizzle-orm';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const chats = await db.select()
      .from(workspaceChats)
      .where(eq(workspaceChats.userId, user.id))
      .orderBy(desc(workspaceChats.updatedAt));

    return NextResponse.json({ success: true, chats });
  } catch (error: any) {
    console.error("Failed to fetch chats:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, kbId } = await req.json();

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const newChat = await db.insert(workspaceChats).values({
      title,
      kbId: kbId || null,
      userId: user.id,
    }).returning();

    return NextResponse.json({ success: true, chat: newChat[0] });
  } catch (error: any) {
    console.error("Failed to create chat:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
