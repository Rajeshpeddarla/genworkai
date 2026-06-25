import { db } from '../db';
import { documents, knowledgeSources, syncJobs } from '../db/schema';

async function main() {
  try {
    const docs = await db.select().from(documents);
    console.log('Docs count:', docs.length);
    if (docs.length > 0) {
       console.log('Sample doc:', docs[0]?.title);
    }
    const sources = await db.select().from(knowledgeSources);
    console.log('Sources count:', sources.length);
    const jobs = await db.select().from(syncJobs);
    console.log('Jobs count:', jobs.length, 'Statuses:', jobs.map(j => j.status));
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}
main();
