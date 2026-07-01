import { generateEmbedding } from '../lib/embeddings';

async function run() {
  try {
    const vec = await generateEmbedding("hello world");
    console.log("Success! Dimensions:", vec.length);
  } catch (err) {
    console.error(err);
  }
}

run();
