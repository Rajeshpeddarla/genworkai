import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerTools } from './tools';

export const activeTransports = new Map<string, SSEServerTransport>();

// We need a helper to create the server for each session
export function createSessionServer() {
  const server = new McpServer({
    name: "GenWorkAI-Database-MCP",
    version: "1.0.0"
  });
  registerTools(server);
  return server;
}
