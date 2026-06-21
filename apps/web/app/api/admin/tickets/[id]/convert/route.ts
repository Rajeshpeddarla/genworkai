import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tickets, workspaceArtifacts, workspaceChats } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, error } = await requireAdmin();
    if (error) return error;

    const ticketId = (await params).id;

    // Fetch the ticket
    const ticketQuery = await db.select().from(tickets).where(eq(tickets.id, ticketId)).limit(1);
    const ticket = ticketQuery[0];

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Determine artifact type based on ticket type
    let artifactType = 'document';
    let artifactCategory = 'General';

    if (ticket.type === 'bug') {
      artifactType = 'report';
      artifactCategory = 'Bug Investigation';
    } else if (ticket.type === 'feature_request') {
      artifactType = 'document';
      artifactCategory = 'Feature Proposal';
    } else if (ticket.type === 'demo' || ticket.type === 'sales') {
      artifactType = 'document';
      artifactCategory = 'Sales Notes';
    } else {
      artifactType = 'document';
      artifactCategory = 'Support Context';
    }

    // Create a new Workspace Chat just for this ticket artifact
    const chats = await db.insert(workspaceChats).values({
      userId: user.id,
      title: `Ticket Artifact: ${ticket.subject}`,
    }).returning();
    const chat = chats[0];

    if (!chat) {
        throw new Error('Failed to create workspace chat for artifact');
    }

    // Create the artifact
    await db.insert(workspaceArtifacts).values({
      chatId: chat.id,
      name: `${ticket.subject} - ${ticket.name || 'Anonymous'}`,
      fileType: artifactType,
      category: artifactCategory,
      status: 'draft',
      relationships: {
        source_ticket_id: ticket.id,
        content_preview: ticket.message
      }
    });

    // Optionally mark the ticket as acknowledged/in_progress
    await db.update(tickets).set({ status: 'in_progress', assignedTo: user.id }).where(eq(tickets.id, ticket.id));

    return NextResponse.json({ success: true, message: 'Artifact generated successfully' });
  } catch (error: any) {
    console.error('Failed to convert ticket:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
