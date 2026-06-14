import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import * as readline from 'readline';

const url = process.argv[2];
if (!url) {
  console.error("Missing URL argument");
  process.exit(1);
}

const transport = new SSEClientTransport(new URL(url), {
  requestInit: {
    headers: {
      'Authorization': `Bearer ${process.env.GENWORKAI_API_KEY || ''}`
    }
  },
  eventSourceInit: {
    headers: {
      'Authorization': `Bearer ${process.env.GENWORKAI_API_KEY || ''}`
    }
  } as any
});

async function main() {
  transport.onmessage = (message) => {
    // Send message from SSE server back to stdio client (Antigravity/Claude Desktop)
    console.log(JSON.stringify(message));
  };

  transport.onclose = () => {
    process.exit(0);
  };

  transport.onerror = (err) => {
    console.error("SSE Transport Error:", err);
  };

  await transport.start();

  // Read stdin from the IDE and send to the SSE server
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  rl.on('line', async (line) => {
    if (!line.trim()) return;
    try {
      const message = JSON.parse(line);
      await transport.send(message);
    } catch (e) {
      console.error("Failed to parse or send message:", e);
    }
  });
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
