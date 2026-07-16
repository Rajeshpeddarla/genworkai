import { inngest } from "../../client";
import { db } from "../../../db";
import { documents, documentProcessingLogs, syncJobs, knowledgeSources, knowledgeNodes, knowledgeEdges } from "../../../db/schema";
import { eq, sql } from "drizzle-orm";
import { CreditService } from "../../../lib/billing/CreditService";

export const graphWorker: any = inngest.createFunction(
  { id: "kb-process-graph", name: "Knowledge Base: Graph", triggers: [{ event: "knowledge/process.graph" }] },
  async ({ event, step }: any) => {
    const { documentId, sourceId, syncJobId, storageKey, mimeType, usageId } = event.data;

    await step.run("init-graph", async () => {
      await db.update(documents)
        .set({ status: 'graph', updatedAt: new Date() })
        .where(eq(documents.id, documentId));
        
      await db.insert(documentProcessingLogs).values({
        documentId,
        stage: 'graph',
        status: 'started',
        message: 'Started knowledge graph extraction.',
      });
    });

    // Call Python FastAPI worker
    const workerUrl = process.env.PYTHON_WORKER_URL || 'http://localhost:8000';
    try {
      const response = await fetch(`${workerUrl}/api/worker/graph`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storageKey, mimeType })
      });
      
      if (!response.ok) {
        throw new Error(`Python worker failed: ${response.statusText}`);
      }
      
      const graphResult = await response.json();
      
      await step.run("save-graph-nodes", async () => {
        const doc = await db.query.documents.findFirst({
          where: eq(documents.id, documentId)
        });
        if (!doc?.kbId) return;

        const insertedNodes = [];
        for (const node of graphResult.nodes || []) {
          const inserted = await db.insert(knowledgeNodes).values({
            kbId: doc.kbId,
            name: node.name,
            type: node.type,
            description: node.description,
            metadata: { documentId }
          }).returning();
          if (inserted.length > 0) {
            insertedNodes.push(inserted[0]?.id);
          }
        }

        for (const edge of graphResult.edges || []) {
          const sIdx = edge.sourceNodeIndex;
          const tIdx = edge.targetNodeIndex;
          if (sIdx !== undefined && tIdx !== undefined && insertedNodes[sIdx] && insertedNodes[tIdx]) {
            await db.insert(knowledgeEdges).values({
              sourceNodeId: insertedNodes[sIdx],
              targetNodeId: insertedNodes[tIdx],
              relationshipType: edge.relationshipType,
              weight: edge.weight ? String(edge.weight) : "1.0",
              documentRefs: [documentId]
            });
          }
        }
      });

      await step.run("finalize-graph", async () => {
        await db.update(documents)
          .set({ status: 'completed', kgVersion: 1, updatedAt: new Date() })
          .where(eq(documents.id, documentId));

        await db.insert(documentProcessingLogs).values({
          documentId,
          stage: 'graph',
          status: 'success',
          message: `Graph generation completed. Nodes: ${graphResult.nodes?.length || 0}`,
        });
        
        // Complete the sync job
        if (syncJobId) {
          await db.update(syncJobs)
            .set({ status: 'completed', finishedAt: new Date() })
            .where(eq(syncJobs.id, syncJobId));
        }
        
        if (sourceId) {
          await db.update(knowledgeSources)
            .set({ syncStatus: 'success', lastSyncAt: new Date(), lastSuccessfulSyncAt: new Date() })
            .where(eq(knowledgeSources.id, sourceId));
        }

        if (usageId) {
          await CreditService.finalize(usageId);
        }
      });
    } catch (error: any) {
      await db.update(documents).set({ status: 'failed', updatedAt: new Date() }).where(eq(documents.id, documentId));
      await db.insert(documentProcessingLogs).values({ documentId, stage: 'graph', status: 'error', message: error.message });
      throw error;
    }
  }
);
