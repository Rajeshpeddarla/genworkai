const { generateText } = require('ai');
const { createOpenAI } = require('@ai-sdk/openai');

const deepseek = createOpenAI({
  apiKey: 'sk-a94cc61c538d4143968e29fb8e5089c0',
  baseURL: 'https://api.deepseek.com/v1',
  fetch: async (url, options) => {
    console.log('Intercepted fetch to:', url);
    return fetch(url, options);
  }
});

async function test() {
  try {
    const { text } = await generateText({
      model: deepseek('deepseek-v4-flash'),
      prompt: 'Hello',
    });
    console.log(text);
  } catch(e) {
    console.log('Error:', e.message);
  }
}
test();
