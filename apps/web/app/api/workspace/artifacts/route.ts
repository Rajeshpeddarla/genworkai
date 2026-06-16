import { NextResponse } from 'next/server';
import { db } from '../../../../db';
import { workspaceArtifacts, workspaceArtifactVersions, workspaceChats } from '../../../../db/schema';
import { desc, eq, sql } from 'drizzle-orm';

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

    // Fetch artifacts belonging to chats owned by the user
    const artifacts = await db.select({
      id: workspaceArtifacts.id,
      chatId: workspaceArtifacts.chatId,
      name: workspaceArtifacts.name,
      fileType: workspaceArtifacts.fileType,
      category: workspaceArtifacts.category,
      status: workspaceArtifacts.status,
      isPinned: workspaceArtifacts.isPinned,
      createdAt: workspaceArtifacts.createdAt,
      updatedAt: workspaceArtifacts.updatedAt,
    })
      .from(workspaceArtifacts)
      .innerJoin(workspaceChats, eq(workspaceArtifacts.chatId, workspaceChats.id))
      .where(eq(workspaceChats.userId, user.id))
      .orderBy(desc(workspaceArtifacts.updatedAt));

    // Fetch the latest version content for each artifact
    const artifactIds = artifacts.map((a: any) => a.id);
    let versionsMap: Record<number, any> = {};

    if (artifactIds.length > 0) {
      // Fetch all versions and find latest in JS to avoid Drizzle raw SQL array serialization issues
      const allVersions = await db.select().from(workspaceArtifactVersions);

      for (const row of allVersions) {
        const existing = versionsMap[row.artifactId as number];
        if (!existing || (row.versionNumber as number) > existing.versionNumber) {
          versionsMap[row.artifactId as number] = row;
        }
      }
    }

    const formattedArtifacts = artifacts.map((a: any) => ({
      ...a,
      version: versionsMap[a.id]?.versionNumber || 1,
      content: versionsMap[a.id]?.content || '',
      sourceDocIds: versionsMap[a.id]?.sourceDocIds || []
    }));

    return NextResponse.json({ success: true, artifacts: formattedArtifacts });
  } catch (error: any) {
    console.error("Failed to fetch artifacts:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
