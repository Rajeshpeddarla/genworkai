import { NextResponse } from 'next/server';
import { mcpServer, transports } from '../../../../lib/mcp/server';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import crypto from 'crypto';

export async function GET(req: Request, { params }: { params: Promise<{ mcp: string[] }> }) {
  const { mcp } = await params;
  if (mcp[0] !== 'sse') {
    return new NextResponse('Not found', { status: 404 });
  }

  const authHeader = req.headers.get('authorization');
  
  // Basic check for API key
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // Set up SSE headers
  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  
  const sseResponse = new Response(responseStream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });

  const sessionId = crypto.randomUUID();
  const transport = new SSEServerTransport(
    `/api/mcp/messages?sessionId=${sessionId}`,
    {
      writeHead: () => {},
      write: (data: string) => writer.write(new TextEncoder().encode(data)),
      end: () => writer.close(),
      on: () => {},
    } as any // bypass standard Node HTTP Response typing
  );

  transports.set(sessionId, transport);

  // Connect the transport to our server singleton
  mcpServer.connect(transport).catch(console.error);

  req.signal.addEventListener('abort', () => {
    transport.close();
    transports.delete(sessionId);
  });

  return sseResponse;
}

export async function POST(req: Request, { params }: { params: Promise<{ mcp: string[] }> }) {
  const { mcp } = await params;
  if (mcp[0] !== 'messages') {
    return new NextResponse('Not found', { status: 404 });
  }

  const url = new URL(req.url);
  const sessionId = url.searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
  }

  const transport = transports.get(sessionId);
  if (!transport) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  try {
    const message = await req.json();
    await transport.handlePostMessage(req as any, { send: async () => {} } as any);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
