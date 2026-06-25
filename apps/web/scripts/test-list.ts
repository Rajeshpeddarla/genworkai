import { db } from '../db';
import { knowledgeBases, documents } from '../db/schema';
import { inArray, sql } from 'drizzle-orm';

async function testListAPI() {
  const kbs = await db.select().from(knowledgeBases);
  console.log("KBs:", kbs.map(kb => ({ id: kb.id, name: kb.name })));

  let kbWithDocs: any[] = [];
  if (kbs.length > 0) {
    const kbIds = kbs.map(kb => kb.id);
    
    const docCounts = await db.select({
      kbId: documents.kbId,
      count: sql<number>`count(*)::int`
    })
    .from(documents)
    .where(inArray(documents.kbId, kbIds))
    .groupBy(documents.kbId);

    const allDocs = await db.select().from(documents).where(inArray(documents.kbId, kbIds));
    
    const countMap = new Map(docCounts.map(dc => [dc.kbId, dc.count]));

    kbWithDocs = kbs.map((kb: any) => {
      const kbDocs = allDocs.filter(d => d.kbId === kb.id);
      return { 
        id: kb.id,
        name: kb.name,
        documents: kbDocs.map(d => ({ id: d.id, title: d.title, kbId: d.kbId })),
        documentCount: countMap.get(kb.id) || 0 
      };
    });
  }

  console.log("kbWithDocs:", JSON.stringify(kbWithDocs, null, 2));
}

testListAPI().catch(console.error);
