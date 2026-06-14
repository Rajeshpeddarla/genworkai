import { config } from 'dotenv';

// Try to load local .env.local if running in a development context, but fail silently if not found.
config({ path: '.env.local' });
config();

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { mcpServer } from './server.js';

async function main() {
  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
  console.error("GenWorkAI MCP Server running natively on stdio");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
