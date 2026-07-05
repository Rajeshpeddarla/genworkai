import { streamText } from 'ai';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { config } from 'dotenv';

config({ path: '.env.local' });

async function test() {
  const deepseek = createDeepSeek({
    apiKey: process.env.DEEPSEEK_API_KEY || 'fake-key',
    baseURL: process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com',
  });

  try {
    const result = streamText({
      model: deepseek.chat('deepseek-v4-flash'),
      messages: [
        { role: 'system', content: 'You are a bot.' },
        { role: 'user', content: 'Hello' }
      ],
    });

    for await (const textPart of result.textStream) {
      process.stdout.write(textPart);
    }
  } catch (err) {
    console.error(err);
  }
}

test();
