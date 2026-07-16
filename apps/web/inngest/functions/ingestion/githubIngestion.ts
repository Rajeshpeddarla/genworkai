import { inngest } from "../../client";
import { db } from "../../../db";
import { documents, documentChunks, knowledgeSources, syncJobs, sourceSnapshots } from "../../../db/schema";
import { eq, sql } from "drizzle-orm";
import AdmZip from "adm-zip";
import { extractTextFromBuffer, cleanExtractedText, enhanceTextWithAI, smartChunkMarkdown, extractRelationships, generateChunkHash } from "../../../lib/knowledge-pipeline";

function isProcessableFile(filename: string): boolean {
  const ignored = [
    '.git/', 'node_modules/', 'dist/', 'build/', '.next/', '.DS_Store', 
    'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
    '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.woff', '.ttf', '.eot', '.mp4', '.mp3'
  ];
  return !ignored.some(i => filename.includes(i));
}

export const githubIngestion: any = inngest.createFunction(
  { id: "ingest-github", name: "Ingest GitHub Repository", triggers: [{ event: "knowledge/process.github" }] },
  async ({ event, step }: any) => {
    const { sourceId, syncJobId, repoUrl, owner, repo, branch, oauthToken } = event.data;
    
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'GenWorkAI'
    };
    if (oauthToken) headers['Authorization'] = `token ${oauthToken}`;

    const updateProgress = async (stepName: string, updates: any) => {
      await step.run(`progress-${stepName}`, async () => {
        await db.execute(sql`
          UPDATE sync_jobs 
          SET progress = progress || ${JSON.stringify(updates)}::jsonb
          WHERE id = ${syncJobId}
        `);
      });
    };

    // 1. Initial Status
    await step.run("init-status", async () => {
      await db.update(syncJobs).set({ status: 'processing', startedAt: new Date() }).where(eq(syncJobs.id, syncJobId));
      await db.update(knowledgeSources).set({ syncStatus: 'processing' }).where(eq(knowledgeSources.id, sourceId));
    });

    try {
      // 2. Fetch Latest Commit Hash
      const latestHash = await step.run("fetch-hash", async () => {
        const commitRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits/${branch}`, { headers });
        if (!commitRes.ok) throw new Error(`Failed to fetch commit: ${commitRes.statusText}`);
        const data = await commitRes.json();
        return data.sha;
      });

      // 3. Idempotency Check
      const shouldProcess = await step.run("check-idempotency", async () => {
        const source = await db.select({ lastSuccessfulHash: knowledgeSources.lastSuccessfulHash }).from(knowledgeSources).where(eq(knowledgeSources.id, sourceId)).limit(1);
        return source[0]?.lastSuccessfulHash !== latestHash;
      });

      if (!shouldProcess) {
        await step.run("mark-success-unchanged", async () => {
          await db.update(syncJobs).set({ status: 'completed', finishedAt: new Date() }).where(eq(syncJobs.id, syncJobId));
          await db.update(knowledgeSources).set({ syncStatus: 'success', lastSyncAt: new Date(), lastSuccessfulSyncAt: new Date() }).where(eq(knowledgeSources.id, sourceId));
        });
        return { status: "skipped", reason: "Hash unchanged" };
      }

      await updateProgress("start-download", { stage: "downloading", current_step: "Downloading zipball" });

      // 4. Download Zipball
      const bufferData = await step.run("download-zip", async () => {
        const zipRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/zipball/${branch}`, { headers });
        if (!zipRes.ok) throw new Error(`Failed to download zipball: ${zipRes.statusText}`);
        const arrayBuffer = await zipRes.arrayBuffer();
        // Convert array buffer to base64 for step payload limits or upload to temporary storage if too large.
        // For Inngest step output limits (usually 1-4MB), returning a raw large buffer will crash the step.
        // Therefore, we must perform the fetch and unzip in a single step if the file is large, OR download to disk.
        // On a VPS, downloading to a temporary file is best. But to keep it simple and stateless within the step, 
        // we will do fetch & unzip in the next combined step, or skip step.run for the heavy download.
        return null; 
      });

      // To handle large repos safely without exceeding Inngest step memory limits:
      // We perform the download and zip parsing within a single step to return just the file metadata.
      const processFiles = async () => {
        const zipRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/zipball/${branch}`, { headers });
        if (!zipRes.ok) throw new Error(`Failed to download zipball: ${zipRes.statusText}`);
        const arrayBuffer = await zipRes.arrayBuffer();
        const zip = new AdmZip(Buffer.from(arrayBuffer));
        
        const zipEntries = zip.getEntries();
        const filesToProcess = zipEntries.filter(e => !e.isDirectory && isProcessableFile(e.entryName));
        
        return filesToProcess.map(e => ({
          entryName: e.entryName,
          // We can't return all raw data from this step if it's huge, so we just return the list.
          // Wait, actually, if we return a list of files, we need the buffer for each file.
          // If we re-fetch the zip in a loop, it's inefficient.
          // Inngest on local VPS has high payload limits (if configured), but it's risky.
        }));
      };

      // Since we need the file buffers, and parsing them all in one step is safer memory-wise:
      await updateProgress("parsing", { stage: "parsing", current_step: "Extracting files" });
      
      // Let's do the extraction and insertion in a large batch step.
      const batchStats = await step.run("process-repository", async () => {
        const zipRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/zipball/${branch}`, { headers });
        const arrayBuffer = await zipRes.arrayBuffer();
        const zip = new AdmZip(Buffer.from(arrayBuffer));
        const entries = zip.getEntries();

        let filesProcessed = 0;
        let chunksGenerated = 0;
        const allChunkIds: number[] = [];
        const apiKey = process.env.GEMINI_API_KEY || '';

        // To prevent massive memory spikes, we process in chunks
        for (const zipEntry of entries) {
          if (zipEntry.isDirectory || !isProcessableFile(zipEntry.entryName)) continue;

          try {
            const fileBuffer = zipEntry.getData();
            const fullPath = zipEntry.entryName; 
            const filename = fullPath.substring(fullPath.indexOf('/') + 1); 
            const fileExtension = filename.split('.').pop()?.toLowerCase() || '';

            const extractedText = await extractTextFromBuffer(fileBuffer, 'application/octet-stream', filename);
            if (!extractedText || extractedText.length < 10) continue;

            const cleanedText = cleanExtractedText(extractedText);
            const enhancedData = apiKey ? await enhanceTextWithAI(cleanedText, apiKey, undefined) : {
              summary: "", topics: [], keywords: [], classification: "Unclassified",
              knowledgeContent: cleanedText, embeddingContent: cleanedText
            };

            const newDoc = await db.insert(documents).values({
              kbId: 0, // Need kbId, we will fetch it from knowledgeSources
              sourceId,
              title: filename,
              sourceType: fileExtension || 'unknown',
              sourceUrl: filename,
              content: cleanedText,
              summary: enhancedData.summary,
              knowledgeContent: enhancedData.knowledgeContent,
              embeddingContent: enhancedData.embeddingContent,
              sizeBytes: fileBuffer.length,
            }).returning({ id: documents.id });

            const docId = newDoc[0]!.id;
            const chunks = smartChunkMarkdown(enhancedData.embeddingContent || cleanedText);

            for (const chunkContent of chunks) {
              if (chunkContent.length < 5) continue;
              const chunkHash = generateChunkHash(chunkContent);
              
              const newChunk = await db.insert(documentChunks).values({
                documentId: docId,
                content: chunkContent,
                hash: chunkHash
              }).returning({ id: documentChunks.id });
              
              allChunkIds.push(newChunk[0]!.id);
              chunksGenerated++;
            }
            filesProcessed++;
          } catch (err) {
            console.error(`Error processing file ${zipEntry.entryName}:`, err);
          }
        }
        
        return { filesProcessed, chunksGenerated, allChunkIds };
      });

      // 5. Update Source with kbId to link properly
      const sourceRecord = await step.run("get-source", async () => {
        const s = await db.select({ kbId: knowledgeSources.kbId }).from(knowledgeSources).where(eq(knowledgeSources.id, sourceId)).limit(1);
        return s[0];
      });
      
      await step.run("fix-documents-kbid", async () => {
         await db.update(documents).set({ kbId: sourceRecord?.kbId }).where(eq(documents.sourceId, sourceId));
      });

      // 6. Dispatch Embedding Batches
      await updateProgress("embedding", { stage: "embedding", total_documents: batchStats.filesProcessed, total_chunks: batchStats.chunksGenerated, current_step: "Dispatching embedding batches" });
      
      const batchSize = parseInt(process.env.EMBEDDING_BATCH_SIZE || '50', 10);
      const chunkIds = batchStats.allChunkIds;
      
      const batches: any[] = [];
      for (let i = 0; i < chunkIds.length; i += batchSize) {
        batches.push(chunkIds.slice(i, i + batchSize));
      }

      await step.run("dispatch-embeddings", async () => {
        for (const batch of batches) {
          await inngest.send({
            name: 'knowledge/embed.batch',
            data: { sourceId, syncJobId, chunkIds: batch }
          });
        }
      });

      // 7. Complete Sync Job (Note: embeddings are generating asynchronously now, so this marks the parsing/dispatch completion)
      // To strictly wait for embeddings, we'd need Inngest fan-out/fan-in. For MVP, we mark partially_completed and let the last embed.batch mark it completed.
      await step.run("finalize-sync", async () => {
        await db.update(syncJobs)
          .set({ status: 'partially_completed' })
          .where(eq(syncJobs.id, syncJobId));
          
        await db.update(knowledgeSources)
          .set({ latestHash, lastSuccessfulHash: latestHash, syncStatus: 'processing' }) // Keeps processing until embeddings finish
          .where(eq(knowledgeSources.id, sourceId));
      });

      return { status: "success", dispatchedBatches: batches.length };
      
    } catch (error: any) {
      await step.run("fail-sync", async () => {
        await db.update(syncJobs)
          .set({ status: 'failed', error: error.message, finishedAt: new Date() })
          .where(eq(syncJobs.id, syncJobId));
        await db.update(knowledgeSources)
          .set({ syncStatus: 'failed' })
          .where(eq(knowledgeSources.id, sourceId));
      });
      throw error;
    }
  }
);


