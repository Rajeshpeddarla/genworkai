import { NextResponse } from 'next/server';
import { db } from '../../../../db/index';
import { mcpServers, mcpApiKeys } from '../../../../db/schema';
import { eq, inArray } from 'drizzle-orm';
import crypto from 'crypto';
import { requireUser } from '../../../../lib/auth';
import { logAuditEvent } from '../../../../lib/security/audit';

export async function GET() {
  try {
    const { user, error: authError } = await requireUser();
    if (authError) return authError;

    const servers = await db.select().from(mcpServers).where(eq(mcpServers.userId, user.id));
    const serverIds = servers.map(s => s.id);
    
    // Ensure we don't fetch all keys in the system
    const keys = serverIds.length > 0 
      ? await db.select().from(mcpApiKeys).where(inArray(mcpApiKeys.serverId, serverIds))
      : [];

    // attach keys to servers
    const serversWithKeys = servers.map((server) => {
      const serverKeys = keys.filter(k => k.serverId === server.id);
      return {
        ...server,
        keys: serverKeys
      };
    });

    return NextResponse.json(serversWithKeys);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { user, error: authError } = await requireUser();
    if (authError) return authError;

    const body = await req.json();
    const { name, description, kbIds, enabledCapabilities, permissionLevel } = body;

    // Create server
    const [newServer] = await db.insert(mcpServers).values({
      userId: user.id,
      name,
      description,
      kbIds,
      enabledCapabilities,
      status: 'active'
    }).returning();

    // Generate API Key
    if (!newServer) {
        throw new Error('Failed to create server');
    }
    const rawKey = `sk-genworkai-${crypto.randomBytes(16).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    const [newKey] = await db.insert(mcpApiKeys).values({
      serverId: newServer.id,
      name: `${name} Key`,
      keyHash,
      permissionLevel: permissionLevel || 'read_only'
    }).returning();

    await logAuditEvent({
      userId: user.id,
      action: 'CREATE_MCP_SERVER',
      resourceType: 'mcp_server',
      resourceId: newServer.id,
      metadata: { name: newServer.name }
    });

    return NextResponse.json({
      server: newServer,
      key: {
        ...newKey,
        rawKey // only return this once
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
