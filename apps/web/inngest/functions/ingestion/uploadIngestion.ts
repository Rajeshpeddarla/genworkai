import { inngest } from "../../client";
import { db } from "../../../db";
import { documents, documentChunks, knowledgeSources, syncJobs, sourceSnapshots } from "../../../db/schema";
import { eq, sql } from "drizzle-orm";
import { CreditService } from "../../../lib/billing/CreditService";
import fs from "fs/promises";
import crypto from 'crypto';
import { extractTextFromBuffer, cleanExtractedText, enhanceTextWithAI, smartChunkMarkdown, extractRelationships, generateChunkHash } from "../../../lib/knowledge-pipeline";

export const uploadIngestion: any = inngest.createFunction(
  { id: "ingest-upload", name: "Ingest File Upload", triggers: [{ event: "knowledge/process.upload" }] },
  async ({ event, step }: any) => {
    const { sourceId, syncJobId, filePath, originalName, mimeType, usageId } = event.data;

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
      await updateProgress("reading", { stage: "reading", current_step: `Reading ${originalName}` });

      const batchStats = await step.run("process-file", async () => {
        const fileBuffer = await fs.readFile(filePath);
        
        const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
        const source = await db.select({ lastSuccessfulHash: knowledgeSources.lastSuccessfulHash }).from(knowledgeSources).where(eq(knowledgeSources.id, sourceId)).limit(1);
        
        // We removed the lastSuccessfulHash skip logic for direct uploads because if a user deletes a file and re-uploads it, it was getting skipped.

        const sourceRecord = await db.select({ kbId: knowledgeSources.kbId }).from(knowledgeSources).where(eq(knowledgeSources.id, sourceId)).limit(1);
        const kbId = sourceRecord[0]?.kbId || 0;

        const fileExtension = originalName.split('.').pop()?.toLowerCase() || '';

        const extractedText = await extractTextFromBuffer(fileBuffer, mimeType || 'application/octet-stream', originalName);
        if (!extractedText || extractedText.length < 10) {
          throw new Error("Failed to extract enough text from the document");
        }

        const cleanedText = cleanExtractedText(extractedText);
        const apiKey = process.env.DEEPSEEK_API_KEY || '';
        const enhancedData = apiKey ? await enhanceTextWithAI(cleanedText, apiKey, process.env.DEEPSEEK_API_URL) : {
          summary: "", topics: [], keywords: [], classification: "Unclassified",
          knowledgeContent: cleanedText, embeddingContent: cleanedText
        };

        const newDoc = await db.insert(documents).values({
          kbId, sourceId, title: originalName, sourceType: fileExtension || 'unknown',
          sourceUrl: originalName, content: cleanedText, summary: enhancedData.summary,
          topics: enhancedData.topics, keywords: enhancedData.keywords, classification: enhancedData.classification,
          knowledgeContent: enhancedData.knowledgeContent, embeddingContent: enhancedData.embeddingContent,
          sizeBytes: fileBuffer.length,
          metadata: { originalName, processingStrategy: "3-artifact", relationships: { related: [] } }
        }).returning({ id: documents.id });

        const docId = newDoc[0]!.id;
        const chunks = smartChunkMarkdown(enhancedData.embeddingContent || cleanedText);
        const allChunkIds: number[] = [];

        for (const chunkContent of chunks) {
          if (chunkContent.length < 5) continue;
          const chunkHash = generateChunkHash(chunkContent);
          const newChunk = await db.insert(documentChunks).values({
            documentId: docId, content: chunkContent, hash: chunkHash
          }).returning({ id: documentChunks.id });
          allChunkIds.push(newChunk[0]!.id);
        }

        return { skipped: false, chunksGenerated: allChunkIds.length, allChunkIds, fileHash };
      });

      if (batchStats.skipped) {
        await step.run("mark-success-unchanged", async () => {
          await db.update(syncJobs).set({ status: 'completed', finishedAt: new Date() }).where(eq(syncJobs.id, syncJobId));
          await db.update(knowledgeSources).set({ syncStatus: 'success', lastSyncAt: new Date(), lastSuccessfulSyncAt: new Date() }).where(eq(knowledgeSources.id, sourceId));
          if (usageId) await CreditService.finalize(usageId, { actualCredits: 0 }); // Refund, we didn't do much work
        });
        await fs.unlink(filePath).catch(() => {});
        return { status: "skipped", reason: "Hash unchanged" };
      }

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
        await db.update(knowledgeSources).set({ latestHash: batchStats.fileHash, lastSuccessfulHash: batchStats.fileHash, syncStatus: 'processing' }).where(eq(knowledgeSources.id, sourceId));
      });

      await step.run("cleanup", async () => {
        await fs.unlink(filePath).catch(() => {});
        if (usageId) await CreditService.finalize(usageId);
      });

      return { status: "success", dispatchedBatches: batches.length };

    } catch (error: any) {
      await step.run("fail-sync", async () => {
        await db.update(syncJobs).set({ status: 'failed', error: error.message, finishedAt: new Date() }).where(eq(syncJobs.id, syncJobId));
        await db.update(knowledgeSources).set({ syncStatus: 'failed' }).where(eq(knowledgeSources.id, sourceId));
        if (usageId) await CreditService.finalize(usageId, { actualCredits: 0 }); // Refund on failure
      });
      await fs.unlink(filePath).catch(() => {});
      throw error;
    }
  }
);


