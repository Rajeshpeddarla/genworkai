import { inngest } from "../../client";
import { db } from "../../../db";
import { documents, documentProcessingLogs } from "../../../db/schema";
import { eq, sql } from "drizzle-orm";

export const chunkWorker: any = inngest.createFunction(
  { id: "kb-process-chunk", name: "Knowledge Base: Chunk", triggers: [{ event: "knowledge/process.chunk" }] },
  async ({ event, step }: any) => {
    const { documentId, sourceId, syncJobId, storageKey, mimeType, usageId } = event.data;

    await step.run("init-chunk", async () => {
      await db.update(documents)
        .set({ status: 'chunking', updatedAt: new Date() })
        .where(eq(documents.id, documentId));
        
      await db.insert(documentProcessingLogs).values({
        documentId,
        stage: 'chunking',
        status: 'started',
        message: 'Started hierarchical chunking and Layout Analysis.',
      });
    });

    // Call Python FastAPI worker
    const workerUrl = process.env.PYTHON_WORKER_URL || 'http://localhost:8000';
    try {
      const response = await fetch(`${workerUrl}/api/worker/chunk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storageKey, mimeType })
      });
      
      if (!response.ok) {
        throw new Error(`Python worker failed: ${response.statusText}`);
      }
      
      const chunkResult = await response.json();
      
      await step.run("finalize-chunk", async () => {
        await db.update(documents)
          .set({ chunkingVersion: 1, updatedAt: new Date() })
          .where(eq(documents.id, documentId));

        await db.insert(documentProcessingLogs).values({
          documentId,
          stage: 'chunking',
          status: 'success',
          message: `Chunking completed. Generated ${chunkResult.chunks?.length || 0} chunks.`,
        });
      });
    } catch (error: any) {
      await db.update(documents).set({ status: 'failed', updatedAt: new Date() }).where(eq(documents.id, documentId));
      await db.insert(documentProcessingLogs).values({ documentId, stage: 'chunking', status: 'error', message: error.message });
      throw error;
    }
    await step.sendEvent("trigger-embed", {
      name: 'knowledge/process.embed',
      data: { documentId, sourceId, syncJobId, storageKey, mimeType, usageId }
    });

    return { status: "success", stage: "chunking" };
  }
);
