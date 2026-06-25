async function testDeepSeek() {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const apiUrl = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1';

  if (!apiKey) {
    console.error('No API key found in DEEPSEEK_API_KEY');
    return;
  }

  const endpoint = apiUrl.endsWith('/chat/completions') ? apiUrl : `${apiUrl.replace(/\/$/, '')}/chat/completions`;

  const requestBody = {
    model: 'deepseek-chat', // The official model name for DeepSeek-V3
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Hello! Please reply with exactly: "DeepSeek API is working perfectly!"' }
    ]
  };

  console.log('--- REQUEST ---');
  console.log(`URL: ${endpoint}`);
  console.log('Headers: {');
  console.log(`  'Content-Type': 'application/json',`);
  console.log(`  'Authorization': 'Bearer ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}'`);
  console.log('}');
  console.log('Body:');
  console.log(JSON.stringify(requestBody, null, 2));
  console.log('\nSending request...\n');

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    const status = res.status;
    const text = await res.text();

    console.log('--- RESPONSE ---');
    console.log(`Status: ${status} ${res.statusText}`);
    console.log('\nBody:');
    try {
      console.log(JSON.stringify(JSON.parse(text), null, 2));
    } catch(e) {
      console.log(text);
    }

  } catch (error) {
    console.error('--- NETWORK ERROR ---', error);
  }
}

testDeepSeek().catch(console.error);
