import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { registerTools } from './tools';

// Define a singleton or global variable for the server and transport map
// Since Next.js API routes are ephemeral in serverless, we have to store transports
// in a global registry (or rely on a persistent store, but for SSE in a local dev/cloud 
// environment with a single instance, memory works temporarily).
// Ideally, in production, SSE would be handled by a dedicated stateful server, 
// but for this V1, we'll use a global map.

declare global {
  var _mcpTransports: Map<string, SSEServerTransport>;
  var _mcpServer: McpServer;
}

if (!global._mcpTransports) {
  global._mcpTransports = new Map();
}

if (!global._mcpServer) {
  const server = new McpServer({
    name: "GenWorkAI Knowledge OS",
    version: "2.0.0"
  });

  registerTools(server);
  global._mcpServer = server;
}

export const mcpServer = global._mcpServer;
export const transports = global._mcpTransports;
