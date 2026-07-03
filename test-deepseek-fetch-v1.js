async function testFetch() {
  const url = 'https://api.deepseek.com/v1/chat/completions';
  const apiKey = 'sk-a94cc61c538d4143968e29fb8e5089c0';
  
  const payload = {
    model: 'deepseek-chat',
    messages: [{role: 'user', content: 'hello'}]
  };
  
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });
  
  console.log('Status:', res.status, res.statusText);
  const text = await res.text();
  console.log('Body:', text);
}
testFetch();
