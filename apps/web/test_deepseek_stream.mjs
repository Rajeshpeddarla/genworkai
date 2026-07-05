import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { config } from 'dotenv';

config({ path: '.env.local' });

async function test() {
  const deepseek = createOpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY || 'fake-key',
    baseURL: process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com',
  });

  try {
    console.log('Testing streamText with deepseek-v4-flash...');
    const result = streamText({
      model: deepseek.chat('deepseek-v4-flash'),
      messages: [{ role: 'user', content: 'Hello' }],
      async onFinish({ text }) {
        console.log('Stream finished with text:', text);
      }
    });

    for await (const textPart of result.textStream) {
      process.stdout.write(textPart);
    }
    console.log('\nSuccess!');
  } catch (err) {
    console.error('\nError with streamText:');
    console.error(err);
    if (err.cause) console.error('Cause:', err.cause);
  }
}

test();
