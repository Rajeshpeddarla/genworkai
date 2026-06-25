import { db } from '../db';
import { documents, knowledgeBases } from '../db/schema';

async function main() {
  try {
    const kbs = await db.select().from(knowledgeBases);
    console.log('KBs count:', kbs.length);
    if (kbs.length > 0) {
      console.log('KBs:', kbs.map(kb => ({ id: kb.id, userId: kb.userId })));
    }
    const docs = await db.select().from(documents);
    if (docs.length > 0) {
      console.log('Docs KB IDs:', docs.map(d => ({ id: d.id, kbId: d.kbId })));
    }
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}
main();
