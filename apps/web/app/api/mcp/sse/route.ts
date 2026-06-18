import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { activeTransports, createSessionServer, McpSessionContext } from '@/lib/mcp/sse-state';
import { db } from '../../../../db';
import { mcpApiKeys, mcpServers } from '../../../../db/schema';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // 1. Authenticate MCP Connection
  const url = new URL(req.url);
  const authHeader = req.headers.get('authorization');
  let apiKeyStr = url.searchParams.get('apiKey');
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    apiKeyStr = authHeader.substring(7);
  }

  if (!apiKeyStr) {
    return new Response("Missing API Key", { status: 401 });
  }

  const keyHash = crypto.createHash('sha256').update(apiKeyStr).digest('hex');
  
  const keys = await db.select()
    .from(mcpApiKeys)
    .where(eq(mcpApiKeys.keyHash, keyHash));

  const apiKeyRecord = keys[0];

  if (!apiKeyRecord) {
    return new Response("Invalid API Key", { status: 401 });
  }

  if (apiKeyRecord.expiresAt && new Date() > apiKeyRecord.expiresAt) {
    return new Response("API Key expired", { status: 401 });
  }

  // Get associated server
  const servers = await db.select()
    .from(mcpServers)
    .where(eq(mcpServers.id, apiKeyRecord.serverId as number));

  const serverRecord = servers[0];
  if (!serverRecord || serverRecord.status !== 'active') {
    return new Response("Server inactive or not found", { status: 403 });
  }

  // Update last used
  await db.update(mcpApiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(mcpApiKeys.id, apiKeyRecord.id));

  const sessionContext: McpSessionContext = {
    serverId: serverRecord.id,
    userId: serverRecord.userId as string,
    kbIds: (serverRecord.kbIds as number[]) || [],
    permissionLevel: apiKeyRecord.permissionLevel as string,
  };

  let controller: ReadableStreamDefaultController;
  
  const stream = new ReadableStream({
    start(c) {
      controller = c;
    },
    cancel() {
      // Stream cancelled by client
    }
  });

  // Mock an Express response object so SSEServerTransport works inside Next.js App Router
  const resAdapter = {
    writeHead: () => resAdapter,
    write: (data: string) => {
      try {
        controller.enqueue(new TextEncoder().encode(data));
      } catch (e) {
        // Stream might be closed
      }
      return true;
    },
    end: () => {
      try {
        controller.close();
      } catch (e) {}
    },
    on: (event: string, callback: any) => {
      // No-op for 'close' here, we rely on req.signal
    }
  };

  const transport = new SSEServerTransport("/api/mcp/message", resAdapter as any);
  await transport.start();
  
  activeTransports.set(transport.sessionId, { transport, context: sessionContext });
  
  // Attach the session to an MCP Server with validated context
  const server = createSessionServer(sessionContext);
  await server.connect(transport);
  
  // Cleanup when client disconnects
  req.signal.addEventListener("abort", () => {
    activeTransports.delete(transport.sessionId);
    transport.close();
  });

  const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
  const origin = req.headers.get('origin');
  const corsOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': corsOrigin || '', 
    }
  });
}
