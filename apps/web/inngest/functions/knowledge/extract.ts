import { inngest } from "../../client";
import { db } from "../../../db";
import { documents, documentProcessingLogs } from "../../../db/schema";
import { eq, sql } from "drizzle-orm";
import { CreditService } from "../../../lib/billing/CreditService";

export const extractWorker: any = inngest.createFunction(
  { id: "kb-process-extract", name: "Knowledge Base: Extract", triggers: [{ event: "knowledge/process.extract" }] },
  async ({ event, step }: any) => {
    const { documentId, sourceId, syncJobId, storageKey, mimeType, usageId } = event.data;

    await step.run("init-extraction", async () => {
      await db.update(documents)
        .set({ status: 'extracting', updatedAt: new Date() })
        .where(eq(documents.id, documentId));
        
      await db.insert(documentProcessingLogs).values({
        documentId,
        stage: 'extraction',
        status: 'started',
        message: 'Started extraction via Universal Parser.',
      });
    });

    // Call Python FastAPI worker
    const workerUrl = process.env.PYTHON_WORKER_URL || 'http://localhost:8000';
    try {
      const extractionResult = await step.run("call-python-worker", async () => {
        const response = await fetch(`${workerUrl}/api/worker/extract`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storageKey, mimeType })
        });
        
        if (!response.ok) {
          throw new Error(`Python worker failed: ${response.statusText}`);
        }
        
        return await response.json();
      });
      
      await step.run("finalize-extraction", async () => {
        await db.update(documents)
          .set({ 
            extractionVersion: 1, 
            content: extractionResult.text || '', 
            updatedAt: new Date() 
          })
          .where(eq(documents.id, documentId));

        await db.insert(documentProcessingLogs).values({
          documentId,
          stage: 'extraction',
          status: 'success',
          message: 'Extraction completed successfully.',
        });
      });
    } catch (error: any) {
      await step.run("handle-extraction-error", async () => {
        await db.update(documents).set({ status: 'failed', updatedAt: new Date() }).where(eq(documents.id, documentId));
        await db.insert(documentProcessingLogs).values({ documentId, stage: 'extraction', status: 'error', message: error.message });
      });
      throw error;
    }


    // Dispatch next stage
    await step.sendEvent("trigger-render", {
      name: 'knowledge/process.render',
      data: { documentId, sourceId, syncJobId, storageKey, mimeType, usageId }
    });

    return { status: "success", stage: "extraction" };
  }
);
