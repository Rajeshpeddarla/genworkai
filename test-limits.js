const apiKey = process.env.API_KEY || process.argv[2];
const kbId = process.env.KB_ID || process.argv[3];

if (!apiKey || !kbId) {
  console.error("Usage: node test-limits.js <YOUR_API_KEY> <KB_ID>");
  process.exit(1);
}

const url = `http://localhost:3000/api/v1/kb/${kbId}/search`;
const headers = {
  "Authorization": `Bearer ${apiKey}`,
  "Content-Type": "application/json"
};
const body = JSON.stringify({ query: "Test query", limit: 5 });

async function makeRequest(id) {
  const start = Date.now();
  try {
    const res = await fetch(url, { method: 'POST', headers, body });
    const data = await res.json();
    console.log(`[Req ${id}] Status: ${res.status} | Time: ${Date.now() - start}ms | Result:`, data.error || "Success");
    return res.status;
  } catch (err) {
    console.log(`[Req ${id}] Error:`, err.message);
    return 500;
  }
}

async function runTests() {
  console.log("=== TESTING CONCURRENCY (6 requests at once) ===");
  const promises = [];
  for (let i = 1; i <= 6; i++) {
    promises.push(makeRequest(`C-${i}`));
  }
  await Promise.all(promises);

  console.log("\n=== TESTING RATE LIMITS (Spamming 65 requests) ===");
  let rateLimitedCount = 0;
  for (let i = 1; i <= 65; i++) {
    // Fire sequentially or concurrently depending on how fast we want to hit 60/min
    // Let's fire in small batches to simulate rapid traffic
    if (i % 10 === 0) await new Promise(r => setTimeout(r, 100));
    
    makeRequest(`R-${i}`).then(status => {
      if (status === 429) rateLimitedCount++;
    });
  }
  
  // Wait a bit for the background requests to finish
  setTimeout(() => {
    console.log(`\nTest complete! We received 429 Rate Limit responses ${rateLimitedCount} times.`);
  }, 3000);
}

runTests();
