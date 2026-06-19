import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { db } from '../../db';
import { knowledgeBases, connectedDatabases, workspaceChats, workspaceArtifacts, automationTasks, mcpServers, knowledgeSources, documents } from '../../db/schema';
import { eq, and } from 'drizzle-orm';

// ─── Supabase Client Factory ───────────────────────────────────────────────────

/**
 * Creates a Supabase server client from the current request cookies.
 * Uses the publishable key (not service role) so that auth is scoped to the user.
 */
export async function createApiClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // No-op in API routes — cookies are read-only here
        },
      },
    }
  );
}

// ─── Auth Guards ───────────────────────────────────────────────────────────────

export type AuthResult = {
  user: { id: string; email?: string };
  error?: never;
} | {
  user?: never;
  error: NextResponse;
};

/**
 * Verifies the current request has a valid Supabase session.
 * Returns the user object or a 401 NextResponse.
 */
export async function requireUser(): Promise<AuthResult> {
  try {
    const supabase = await createApiClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return {
        error: NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        ),
      };
    }

    return { user: { id: user.id, email: user.email } };
  } catch {
    return {
      error: NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      ),
    };
  }
}

/**
 * Verifies the current user is an admin (profiles.is_admin = true).
 * Returns the user or a 403 NextResponse.
 */
export async function requireAdmin(): Promise<AuthResult> {
  const result = await requireUser();
  if (result.error) return result;

  const { profiles } = await import('../../db/schema');
  const profile = await db.select({ isAdmin: profiles.isAdmin })
    .from(profiles)
    .where(eq(profiles.id, result.user.id))
    .limit(1);

  if (!profile[0]?.isAdmin) {
    return {
      error: NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      ),
    };
  }

  return result;
}

// ─── Ownership Verification ────────────────────────────────────────────────────

export type OwnershipResourceType =
  | 'knowledge_base'
  | 'database'
  | 'chat'
  | 'artifact'
  | 'automation'
  | 'mcp_server'
  | 'source'
  | 'document';

/**
 * Verifies that a resource belongs to the specified user through the ownership chain.
 * Returns null if ownership is valid, or a 403 NextResponse if not.
 *
 * Ownership chains:
 * - knowledge_base → knowledgeBases.userId
 * - database → connectedDatabases.kbId → knowledgeBases.userId
 * - chat → workspaceChats.userId
 * - artifact → workspaceArtifacts.chatId → workspaceChats.userId
 * - automation → automationTasks.userId
 * - mcp_server → mcpServers.userId
 * - source → knowledgeSources.kbId → knowledgeBases.userId
 * - document → documents.kbId → knowledgeBases.userId
 */
export async function requireOwnership(
  resourceType: OwnershipResourceType,
  resourceId: number | string,
  userId: string
): Promise<NextResponse | null> {
  try {
    const id = typeof resourceId === 'string' ? parseInt(resourceId, 10) : resourceId;
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid resource ID' }, { status: 400 });
    }

    switch (resourceType) {
      case 'knowledge_base': {
        const kb = await db.select({ userId: knowledgeBases.userId })
          .from(knowledgeBases)
          .where(eq(knowledgeBases.id, id))
          .limit(1);
        if (!kb[0] || kb[0].userId !== userId) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }
        return null;
      }

      case 'database': {
        const dbRecord = await db.select({ kbId: connectedDatabases.kbId, userId: connectedDatabases.userId })
          .from(connectedDatabases)
          .where(eq(connectedDatabases.id, id))
          .limit(1);
        if (!dbRecord[0]) {
          return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
        }
        if (dbRecord[0].userId === userId) {
          return null; // Directly owned
        }
        if (dbRecord[0].kbId) {
          return requireOwnership('knowledge_base', dbRecord[0].kbId, userId);
        }
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }

      case 'chat': {
        const chat = await db.select({ userId: workspaceChats.userId })
          .from(workspaceChats)
          .where(eq(workspaceChats.id, id))
          .limit(1);
        if (!chat[0] || chat[0].userId !== userId) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }
        return null;
      }

      case 'artifact': {
        const artifact = await db.select({ chatId: workspaceArtifacts.chatId })
          .from(workspaceArtifacts)
          .where(eq(workspaceArtifacts.id, id))
          .limit(1);
        if (!artifact[0]) {
          return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
        }
        return requireOwnership('chat', artifact[0].chatId!, userId);
      }

      case 'automation': {
        const task = await db.select({ userId: automationTasks.userId })
          .from(automationTasks)
          .where(eq(automationTasks.id, id))
          .limit(1);
        if (!task[0] || task[0].userId !== userId) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }
        return null;
      }

      case 'mcp_server': {
        const server = await db.select({ userId: mcpServers.userId })
          .from(mcpServers)
          .where(eq(mcpServers.id, id))
          .limit(1);
        if (!server[0] || server[0].userId !== userId) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }
        return null;
      }

      case 'source': {
        const source = await db.select({ kbId: knowledgeSources.kbId, userId: knowledgeSources.userId })
          .from(knowledgeSources)
          .where(eq(knowledgeSources.id, id))
          .limit(1);
        if (!source[0]) {
          return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
        }
        if (source[0].userId === userId) {
           return null;
        }
        if (source[0].kbId) {
           return requireOwnership('knowledge_base', source[0].kbId, userId);
        }
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }

      case 'document': {
        const doc = await db.select({ kbId: documents.kbId })
          .from(documents)
          .where(eq(documents.id, id))
          .limit(1);
        if (!doc[0]) {
          return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
        }
        return requireOwnership('knowledge_base', doc[0].kbId!, userId);
      }

      default:
        return NextResponse.json({ error: 'Unknown resource type' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Ownership verification failed' }, { status: 500 });
  }
}
