import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerTools } from './tools';

export interface McpSessionContext {
  serverId: number;
  userId: string;
  kbIds: number[];
  permissionLevel: string;
}

export const activeTransports = new Map<string, { transport: SSEServerTransport, context: McpSessionContext }>();

// Create the server for each session, binding the authenticated context
export function createSessionServer(context: McpSessionContext) {
  const server = new McpServer({
    name: "GenWorkAI-Database-MCP",
    version: "1.0.0"
  });
  // Pass context to tools so they can enforce ownership
  registerTools(server, context);
  return server;
}
