import { enhanceTextWithAI } from '../lib/knowledge-pipeline';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function run() {
  console.log("Testing enhanceTextWithAI...");
  const text = "This is a brief test document about Artificial Intelligence in 2026. It discusses the usage of deeply reasoned models.";
  
  try {
    const res = await enhanceTextWithAI(text, process.env.GEMINI_API_KEY!, undefined);
    console.log("Success!");
    console.log(JSON.stringify(res, null, 2));
  } catch (e) {
    console.error("Failed:", e);
  }
}

run();
