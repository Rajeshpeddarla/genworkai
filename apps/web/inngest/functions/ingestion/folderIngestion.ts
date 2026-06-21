import { inngest } from "../../client";
import { db } from "../../../db";
import { documents, documentChunks, knowledgeSources, syncJobs, sourceSnapshots } from "../../../db/schema";
import { eq, sql } from "drizzle-orm";
import AdmZip from "adm-zip";
import fs from "fs/promises";
import crypto from 'crypto';
import { extractTextFromBuffer, cleanExtractedText, enhanceTextWithAI, smartChunkMarkdown, extractRelationships, generateChunkHash } from "../../../lib/knowledge-pipeline";

function isProcessableFile(filename: string): boolean {
  const ignored = [
    '.git/', 'node_modules/', 'dist/', 'build/', '.next/', '.DS_Store', 
    'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
    '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.woff', '.ttf', '.eot', '.mp4', '.mp3'
  ];
  return !ignored.some(i => filename.includes(i));
}

export const folderIngestion: any = inngest.createFunction(
  { id: "ingest-folder", name: "Ingest Folder ZIP", triggers: [{ event: "knowledge/process.folder" }] },
  async ({ event, step }: any) => {
    const { sourceId, syncJobId, filePath, originalName } = event.data;

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
      await updateProgress("reading", { stage: "reading", current_step: "Reading uploaded archive" });

      const batchStats = await step.run("process-folder", async () => {
        const fileBuffer = await fs.readFile(filePath);
        
        // Generate a hash of the entire zip to track idempotency
        const zipHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
        
        const source = await db.select({ lastSuccessfulHash: knowledgeSources.lastSuccessfulHash }).from(knowledgeSources).where(eq(knowledgeSources.id, sourceId)).limit(1);
        if (source[0]?.lastSuccessfulHash === zipHash) {
          return { skipped: true, reason: "Hash unchanged" };
        }

        const zip = new AdmZip(fileBuffer);
        const entries = zip.getEntries();

        let filesProcessed = 0;
        let chunksGenerated = 0;
        const allChunkIds: number[] = [];
        const apiKey = process.env.CKEY_API_KEY || '';

        const sourceRecord = await db.select({ kbId: knowledgeSources.kbId }).from(knowledgeSources).where(eq(knowledgeSources.id, sourceId)).limit(1);
        const kbId = sourceRecord[0]?.kbId || 0;

        for (const zipEntry of entries) {
          if (zipEntry.isDirectory || !isProcessableFile(zipEntry.entryName)) continue;

          try {
            const entryBuffer = zipEntry.getData();
            const filename = zipEntry.entryName;
            const fileExtension = filename.split('.').pop()?.toLowerCase() || '';

            const extractedText = await extractTextFromBuffer(entryBuffer, 'application/octet-stream', filename);
            if (!extractedText || extractedText.length < 10) continue;

            const cleanedText = cleanExtractedText(extractedText);
            const enhancedData = apiKey ? await enhanceTextWithAI(cleanedText, apiKey, process.env.CKEY_API_URL) : {
              summary: "", topics: [], keywords: [], classification: "Unclassified",
              knowledgeContent: cleanedText, embeddingContent: cleanedText
            };

            let relType: 'flutter' | 'dotnet' | 'database' | 'openapi' | 'unknown' = 'unknown';
            if (fileExtension === 'dart') relType = 'flutter';
            else if (fileExtension === 'cs') relType = 'dotnet';
            else if (fileExtension === 'sql') relType = 'database';
            const relationships = extractRelationships(cleanedText, relType);

            const newDoc = await db.insert(documents).values({
              kbId, sourceId, title: filename, sourceType: fileExtension || 'unknown',
              sourceUrl: filename, content: cleanedText, summary: enhancedData.summary,
              topics: enhancedData.topics, keywords: enhancedData.keywords, classification: enhancedData.classification,
              knowledgeContent: enhancedData.knowledgeContent, embeddingContent: enhancedData.embeddingContent,
              sizeBytes: entryBuffer.length,
              metadata: { originalName: filename, processingStrategy: "3-artifact", relationships }
            }).returning({ id: documents.id });

            const docId = newDoc[0]!.id;
            const chunks = smartChunkMarkdown(enhancedData.embeddingContent || cleanedText);

            for (const chunkContent of chunks) {
              if (chunkContent.length < 5) continue;
              const chunkHash = generateChunkHash(chunkContent);
              const newChunk = await db.insert(documentChunks).values({
                documentId: docId, content: chunkContent, hash: chunkHash
              }).returning({ id: documentChunks.id });
              allChunkIds.push(newChunk[0]!.id);
              chunksGenerated++;
            }
            filesProcessed++;
          } catch (err) {
            console.error(`Error processing zip entry ${zipEntry.entryName}:`, err);
          }
        }
        
        return { skipped: false, filesProcessed, chunksGenerated, allChunkIds, zipHash };
      });

      if (batchStats.skipped) {
        await step.run("mark-success-unchanged", async () => {
          await db.update(syncJobs).set({ status: 'completed', finishedAt: new Date() }).where(eq(syncJobs.id, syncJobId));
          await db.update(knowledgeSources).set({ syncStatus: 'success', lastSyncAt: new Date(), lastSuccessfulSyncAt: new Date() }).where(eq(knowledgeSources.id, sourceId));
        });
        // Cleanup temp file
        await fs.unlink(filePath).catch(() => {});
        return { status: "skipped", reason: "Hash unchanged" };
      }

      await updateProgress("embedding", { stage: "embedding", total_documents: batchStats.filesProcessed, total_chunks: batchStats.chunksGenerated, current_step: "Dispatching embedding batches" });

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
        await db.update(knowledgeSources).set({ latestHash: batchStats.zipHash, lastSuccessfulHash: batchStats.zipHash, syncStatus: 'processing' }).where(eq(knowledgeSources.id, sourceId));
      });

      // Cleanup temp file after successful extraction
      await step.run("cleanup", async () => {
        await fs.unlink(filePath).catch(() => {});
      });

      return { status: "success", dispatchedBatches: batches.length };

    } catch (error: any) {
      await step.run("fail-sync", async () => {
        await db.update(syncJobs).set({ status: 'failed', error: error.message, finishedAt: new Date() }).where(eq(syncJobs.id, syncJobId));
        await db.update(knowledgeSources).set({ syncStatus: 'failed' }).where(eq(knowledgeSources.id, sourceId));
      });
      // Cleanup temp file on failure too
      await fs.unlink(filePath).catch(() => {});
      throw error;
    }
  }
);


