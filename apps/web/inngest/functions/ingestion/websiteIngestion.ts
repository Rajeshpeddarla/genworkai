import { inngest } from "../../client";
import { db } from "../../../db";
import { documents, documentChunks, knowledgeSources, syncJobs, sourceSnapshots } from "../../../db/schema";
import { eq, sql } from "drizzle-orm";
import * as cheerio from "cheerio";
import crypto from 'crypto';
import { enhanceTextWithAI, smartChunkMarkdown, generateChunkHash } from "../../../lib/knowledge-pipeline";

export const websiteIngestion: any = inngest.createFunction(
  { id: "ingest-website", name: "Ingest Website Content", triggers: [{ event: "knowledge/process.website" }] },
  async ({ event, step }: any) => {
    const { sourceId, syncJobId, url } = event.data;

    const updateProgress = async (stepName: string, updates: any) => {
      await step.run(`progress-${stepName}`, async () => {
        await db.execute(sql`
          UPDATE sync_jobs 
          SET progress = progress || ${JSON.stringify(updates)}::jsonb
          WHERE id = ${syncJobId}
        `);
      });
    };

    await step.run("init-status", async () => {
      await db.update(syncJobs).set({ status: 'processing', startedAt: new Date() }).where(eq(syncJobs.id, syncJobId));
      await db.update(knowledgeSources).set({ syncStatus: 'processing' }).where(eq(knowledgeSources.id, sourceId));
    });

    try {
      await updateProgress("fetching", { stage: "fetching", current_step: "Downloading webpage" });

      const extracted = await step.run("fetch-and-extract", async () => {
        const response = await fetch(url, { headers: { 'User-Agent': 'GenWorkAI-Knowledge-Bot/1.0' } });
        if (!response.ok) throw new Error(`Failed to fetch website: ${response.statusText}`);
        
        const html = await response.text();
        const $ = cheerio.load(html);
        $('script, style, noscript, iframe, nav, footer, header').remove();
        
        const title = $('title').text().trim() || url;
        let extractedText = $('body').text().replace(/\s+/g, ' ').trim();
        
        if (extractedText.length < 50) throw new Error('Not enough readable content found');
        
        const pageHash = crypto.createHash('sha256').update(extractedText).digest('hex');
        return { extractedText, title, pageHash };
      });

      const { extractedText, title, pageHash } = extracted;

      const shouldProcess = await step.run("check-idempotency", async () => {
        const source = await db.select({ lastSuccessfulHash: knowledgeSources.lastSuccessfulHash }).from(knowledgeSources).where(eq(knowledgeSources.id, sourceId)).limit(1);
        return source[0]?.lastSuccessfulHash !== pageHash;
      });

      if (!shouldProcess) {
        await step.run("mark-success-unchanged", async () => {
          await db.update(syncJobs).set({ status: 'completed', finishedAt: new Date() }).where(eq(syncJobs.id, syncJobId));
          await db.update(knowledgeSources).set({ syncStatus: 'success', lastSyncAt: new Date(), lastSuccessfulSyncAt: new Date() }).where(eq(knowledgeSources.id, sourceId));
        });
        return { status: "skipped", reason: "Hash unchanged" };
      }

      await updateProgress("enhancing", { stage: "enhancing", current_step: "Applying AI enhancement" });

      const batchStats = await step.run("process-content", async () => {
        const apiKey = process.env.DEEPSEEK_API_KEY || '';
        const enhancedData = apiKey ? await enhanceTextWithAI(extractedText, apiKey, process.env.DEEPSEEK_API_URL) : {
          summary: "Website Content", topics: [], keywords: [], classification: "Web Page",
          knowledgeContent: extractedText, embeddingContent: extractedText
        };

        const sourceRecord = await db.select({ kbId: knowledgeSources.kbId }).from(knowledgeSources).where(eq(knowledgeSources.id, sourceId)).limit(1);
        
        const newDoc = await db.insert(documents).values({
          kbId: sourceRecord[0]?.kbId || 0,
          sourceId, title, sourceType: 'html', sourceUrl: url,
          content: extractedText, summary: enhancedData.summary,
          topics: enhancedData.topics, keywords: enhancedData.keywords, classification: enhancedData.classification,
          knowledgeContent: enhancedData.knowledgeContent, embeddingContent: enhancedData.embeddingContent,
          sizeBytes: Buffer.byteLength(extractedText, 'utf8'),
        }).returning({ id: documents.id });

        const docId = newDoc[0]!.id;
        const chunks = smartChunkMarkdown(enhancedData.embeddingContent || extractedText);
        const allChunkIds: number[] = [];

        for (const chunkContent of chunks) {
          if (chunkContent.length < 5) continue;
          const chunkHash = generateChunkHash(chunkContent);
          
          const newChunk = await db.insert(documentChunks).values({
            documentId: docId, content: chunkContent, hash: chunkHash
          }).returning({ id: documentChunks.id });
          allChunkIds.push(newChunk[0]!.id);
        }

        return { chunksGenerated: allChunkIds.length, allChunkIds };
      });

      await updateProgress("embedding", { stage: "embedding", total_documents: 1, total_chunks: batchStats.chunksGenerated, current_step: "Dispatching embedding batches" });

      const batchSize = parseInt(process.env.EMBEDDING_BATCH_SIZE || '50', 10);
      const chunkIds = batchStats.allChunkIds;
      const batches: any[] = [];
      for (let i = 0; i < chunkIds.length; i += batchSize) {
        batches.push(chunkIds.slice(i, i + batchSize));
      }

      await step.run("dispatch-embeddings", async () => {
        for (const batch of batches) {
          await inngest.send({ name: 'knowledge/embed.batch', data: { sourceId, syncJobId, chunkIds: batch } });
        }
      });

      await step.run("finalize-sync", async () => {
        await db.update(syncJobs).set({ status: 'partially_completed' }).where(eq(syncJobs.id, syncJobId));
        await db.update(knowledgeSources).set({ latestHash: pageHash, lastSuccessfulHash: pageHash, syncStatus: 'processing' }).where(eq(knowledgeSources.id, sourceId));
      });

      return { status: "success", dispatchedBatches: batches.length };

    } catch (error: any) {
      await step.run("fail-sync", async () => {
        await db.update(syncJobs).set({ status: 'failed', error: error.message, finishedAt: new Date() }).where(eq(syncJobs.id, syncJobId));
        await db.update(knowledgeSources).set({ syncStatus: 'failed' }).where(eq(knowledgeSources.id, sourceId));
      });
      throw error;
    }
  }
);


