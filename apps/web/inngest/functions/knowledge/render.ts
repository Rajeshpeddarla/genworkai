import { inngest } from "../../client";
import { db } from "../../../db";
import { documents, documentProcessingLogs } from "../../../db/schema";
import { eq, sql } from "drizzle-orm";

export const renderWorker: any = inngest.createFunction(
  { id: "kb-process-render", name: "Knowledge Base: Render", triggers: [{ event: "knowledge/process.render" }] },
  async ({ event, step }: any) => {
    const { documentId, sourceId, syncJobId, storageKey, mimeType, usageId } = event.data;

    await step.run("init-render", async () => {
      await db.update(documents)
        .set({ status: 'rendering', updatedAt: new Date() })
        .where(eq(documents.id, documentId));
        
      await db.insert(documentProcessingLogs).values({
        documentId,
        stage: 'rendering',
        status: 'started',
        message: 'Started PDF rendering and Image Classification.',
      });
    });

    // Call Python FastAPI worker
    const workerUrl = process.env.PYTHON_WORKER_URL || 'http://localhost:8000';
    try {
      const response = await fetch(`${workerUrl}/api/worker/render`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storageKey, mimeType })
      });
      
      if (!response.ok) {
        throw new Error(`Python worker failed: ${response.statusText}`);
      }
      
      const renderResult = await response.json();
      
      await step.run("finalize-render", async () => {
        await db.update(documents)
          .set({ updatedAt: new Date() })
          .where(eq(documents.id, documentId));

        await db.insert(documentProcessingLogs).values({
          documentId,
          stage: 'rendering',
          status: 'success',
          message: `Rendering completed. Processed ${renderResult.pages?.length || 0} pages.`,
        });
      });
    } catch (error: any) {
      await db.update(documents).set({ status: 'failed', updatedAt: new Date() }).where(eq(documents.id, documentId));
      await db.insert(documentProcessingLogs).values({ documentId, stage: 'rendering', status: 'error', message: error.message });
      throw error;
    }


    // Dispatch next stage
    await step.sendEvent("trigger-chunk", {
      name: 'knowledge/process.chunk',
      data: { documentId, sourceId, syncJobId, storageKey, mimeType, usageId }
    });

    return { status: "success", stage: "rendering" };
  }
);
