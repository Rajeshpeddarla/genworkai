import { config } from 'dotenv';
config({ path: 'c:/Users/varun/.gemini/antigravity-ide/scratch/genworkai/apps/web/.env.local' });

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

async function main() {
  const { mcpServer } = await import('../lib/mcp/server.js');
  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
  console.error("GenWorkAI MCP Server running natively on stdio");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
