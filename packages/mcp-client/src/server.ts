import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerTools } from './tools.js';

export const mcpServer = new McpServer({
  name: "GenWorkAI Knowledge OS",
  version: "2.0.0"
});

registerTools(mcpServer);
