import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { config } from 'dotenv';

config({ path: '.env.local' });

async function test() {
  const deepseek = createOpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY || 'fake-key',
    baseURL: process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com',
  });

  try {
    console.log('Testing with deepseek-v4-flash...');
    const result = await generateText({
      model: deepseek.chat('deepseek-v4-flash'),
      prompt: 'Hello',
    });
    console.log('Success:', result.text);
  } catch (err) {
    console.error('Error with deepseek-v4-flash:');
    console.error(err);
    if (err.cause) console.error('Cause:', err.cause);
    if (err.message) console.error('Message:', err.message);
  }

  try {
    console.log('\nTesting with deepseek-chat...');
    const result2 = await generateText({
      model: deepseek.chat('deepseek-chat'),
      prompt: 'Hello',
    });
    console.log('Success:', result2.text);
  } catch (err) {
    console.error('Error with deepseek-chat:');
    console.error(err);
  }
}

test();
