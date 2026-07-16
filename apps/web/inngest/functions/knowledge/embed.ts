import { inngest } from "../../client";
import { db } from "../../../db";
import { documents, documentProcessingLogs, syncJobs, knowledgeSources } from "../../../db/schema";
import { eq, sql } from "drizzle-orm";
import { CreditService } from "../../../lib/billing/CreditService";

export const embedWorker: any = inngest.createFunction(
  { id: "kb-process-embed", name: "Knowledge Base: Embed", triggers: [{ event: "knowledge/process.embed" }] },
  async ({ event, step }: any) => {
    const { documentId, sourceId, syncJobId, storageKey, mimeType, usageId } = event.data;

    await step.run("init-embed", async () => {
      await db.update(documents)
        .set({ status: 'embedding', updatedAt: new Date() })
        .where(eq(documents.id, documentId));
        
      await db.insert(documentProcessingLogs).values({
        documentId,
        stage: 'embedding',
        status: 'started',
        message: 'Started embedding generation.',
      });
    });

    // Call Python FastAPI worker
    const workerUrl = process.env.PYTHON_WORKER_URL || 'http://localhost:8000';
    try {
      const response = await fetch(`${workerUrl}/api/worker/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storageKey, mimeType })
      });
      
      if (!response.ok) {
        throw new Error(`Python worker failed: ${response.statusText}`);
      }
      
      const embedResult = await response.json();
      
      await step.run("finalize-embed", async () => {
        await db.update(documents)
          .set({ embeddingVersion: 1, updatedAt: new Date() })
          .where(eq(documents.id, documentId));

        await db.insert(documentProcessingLogs).values({
          documentId,
          stage: 'embedding',
          status: 'success',
          message: `Embedding completed. Embedded ${embedResult.embeddings?.length || 0} chunks.`,
        });
      });
    } catch (error: any) {
      await db.update(documents).set({ status: 'failed', updatedAt: new Date() }).where(eq(documents.id, documentId));
      await db.insert(documentProcessingLogs).values({ documentId, stage: 'embedding', status: 'error', message: error.message });
      throw error;
    }

    await step.sendEvent("trigger-graph", {
      name: 'knowledge/process.graph',
      data: { documentId, sourceId, syncJobId, storageKey, mimeType, usageId }
    });

    return { status: "success", stage: "embedding" };
  }
);
