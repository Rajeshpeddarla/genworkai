const { generateText } = require('ai');
const { createOpenAI } = require('@ai-sdk/openai');

const deepseek = createOpenAI({
  apiKey: 'sk-a94cc61c538d4143968e29fb8e5089c0', // from .env.local
  baseURL: 'https://api.deepseek.com',
});

async function test() {
  try {
    console.log('Testing deepseek-v4-flash...');
    const { text } = await generateText({
      model: deepseek('deepseek-v4-flash'),
      prompt: 'Hello world! Reply in 2 words.',
    });
    console.log('Flash Response:', text);
  } catch (e) {
    console.error('Flash Error:', e.message);
  }

  try {
    console.log('Testing deepseek-chat...');
    const { text: text2 } = await generateText({
      model: deepseek('deepseek-chat'),
      prompt: 'Hello world! Reply in 2 words.',
    });
    console.log('Chat Response:', text2);
  } catch (e) {
    console.error('Chat Error:', e.message);
  }
}

test();
