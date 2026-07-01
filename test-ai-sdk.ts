import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

async function main() {
  const deepseek = createOpenAI({
    apiKey: 'sk-a94cc61c538d4143968e29fb8e5089c0',
    baseURL: 'https://api.deepseek.com'
  });

  try {
    const res = await generateText({
      model: deepseek.chat('deepseek-v4-flash'),
      prompt: 'hi'
    });
    console.log(res.text);
  } catch (e: any) {
    console.log("URL requested:", e.url);
    console.error(e);
  }
}

main();
