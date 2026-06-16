import { activeTransports } from '@/lib/mcp/sse-state';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // Extract sessionId from URL (Next.js request url parsing)
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  
  if (!sessionId) {
    return new NextResponse("Missing sessionId", { status: 400 });
  }

  const transport = activeTransports.get(sessionId);
  if (!transport) {
    return new NextResponse("Session not found or expired", { status: 404 });
  }

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

    return new NextResponse(responseBody || "Accepted", { 
      status: statusCode === 200 ? 202 : statusCode, // Typically 202 Accepted
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error: any) {
    console.error("MCP Message Error:", error);
    return new NextResponse(error.message, { status: 500 });
  }
}

// OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
