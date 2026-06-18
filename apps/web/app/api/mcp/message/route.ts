import { activeTransports } from '@/lib/mcp/sse-state';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // Extract sessionId from URL (Next.js request url parsing)
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  
  if (!sessionId) {
    return new NextResponse("Missing sessionId", { status: 400 });
  }

  const session = activeTransports.get(sessionId);
  if (!session) {
    return new NextResponse("Session not found or expired", { status: 404 });
  }

  const { transport } = session;

  try {
    const body = await req.json();
    
    // We mock the req/res objects for SSEServerTransport
    const mockReq = {
      headers: {
        'content-type': 'application/json',
      },
      url: req.url,
      socket: {}
    };

    let responseSent = false;
    let statusCode = 200;
    let responseBody = "";

    const mockRes = {
      writeHead: (code: number) => {
        statusCode = code;
        return mockRes;
      },
      end: (data: string) => {
        responseBody = data;
        responseSent = true;
      }
    };

    await transport.handlePostMessage(mockReq as any, mockRes as any, body);

    const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
    const origin = req.headers.get('origin');
    const corsOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

    return new NextResponse(responseBody || "Accepted", { 
      status: statusCode === 200 ? 202 : statusCode, // Typically 202 Accepted
      headers: {
        'Access-Control-Allow-Origin': corsOrigin || ''
      }
    });
  } catch (error: any) {
    console.error("MCP Message Error:", error);
    return new NextResponse(error.message, { status: 500 });
  }
}

// OPTIONS for CORS
export async function OPTIONS(req: NextRequest) {
  const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
  const origin = req.headers.get('origin');
  const corsOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': corsOrigin || '',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
