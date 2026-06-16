import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { activeTransports, createSessionServer } from '@/lib/mcp/sse-state';

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
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
  
  activeTransports.set(transport.sessionId, transport);
  
  // Attach the session to an MCP Server
  const server = createSessionServer();
  await server.connect(transport);
  
  // Cleanup when client disconnects
  req.signal.addEventListener("abort", () => {
    activeTransports.delete(transport.sessionId);
    transport.close();
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      // Ensure CORS allows Cursor or Web tools to connect if needed
      'Access-Control-Allow-Origin': '*', 
    }
  });
}
