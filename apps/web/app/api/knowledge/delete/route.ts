import { NextResponse } from 'next/server';
import { db } from '../../../../db';
import { knowledgeBases, documents, workspaceChats, knowledgeSources } from '../../../../db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'Knowledge Base ID required' }, { status: 400 });

    // Manually delete related records to avoid foreign key constraint violations
    await db.delete(documents).where(eq(documents.kbId, id));
    await db.delete(workspaceChats).where(eq(workspaceChats.kbId, id));
    await db.delete(knowledgeSources).where(eq(knowledgeSources.kbId, id));
    
    // Finally delete the Knowledge Base itself
    await db.delete(knowledgeBases).where(eq(knowledgeBases.id, id));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete Knowledge Base:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
