async function testDeepSeek() {
  const apiKey = process.env.DEEPSEEK_API_KEY || 'sk-a94cc61c538d4143968e29fb8e5089c0';
  const apiUrl = 'https://api.deepseek.com/chat/completions';

  const modelsToTest = ['deepseek-v4-flash', 'deepseek-v4-pro', 'deepseek-chat', 'deepseek-reasoner'];

  for (const model of modelsToTest) {
    console.log(`\nTesting model: ${model}...`);
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: 'hello' }]
        })
      });

      const text = await res.text();
      console.log(`Status: ${res.status}`);
      if (res.status !== 200) {
        console.log(`Error Response: ${text}`);
      } else {
        const json = JSON.parse(text);
        console.log(`Success! Returned model ID: ${json.model}`);
      }
    } catch (e) {
      console.error(e);
    }
  }
}

testDeepSeek().catch(console.error);
