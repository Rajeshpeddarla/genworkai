import { NextResponse } from 'next/server';
import { db } from '../../../../db';
import { workspaceArtifacts, workspaceArtifactVersions, workspaceChats } from '../../../../db/schema';
import { desc, eq } from 'drizzle-orm';
import { requireUser } from '../../../../lib/auth';
import { safeErrorResponse } from '../../../../lib/errors';

export async function GET(req: Request) {
  try {
    const { user, error } = await requireUser();
    if (error) return error;

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
  } catch (error: unknown) {
    return safeErrorResponse(error, 'Get Workspace Artifacts Route');
  }
}
