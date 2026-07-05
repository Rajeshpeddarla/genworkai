import 'dotenv/config';
import { generateText } from 'ai';
import { createDeepSeek } from '@ai-sdk/deepseek';

const openai = createDeepSeek({
  apiKey: process.env.DEEPSEEK_API_KEY || "",
  baseURL: process.env.DEEPSEEK_API_URL || "https://api.deepseek.com",
});

async function main() {
  try {
    const res = await generateText({
      model: openai("deepseek-v4-flash"),
      prompt: 'say hello. respond in JSON format with a response field.',
    });
    console.log("Success:", res.text);
  } catch (e: any) {
    console.error("Error:", e);
  }
}
main();
