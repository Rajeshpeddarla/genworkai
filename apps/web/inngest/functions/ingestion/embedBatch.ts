import { inngest } from "../../client";
import { db } from "../../../db";
import { documentChunks, syncJobs, knowledgeSources } from "../../../db/schema";
import { eq, inArray, sql } from "drizzle-orm";
import { generateEmbedding } from "../../../lib/embeddings";

export const embedBatch: any = inngest.createFunction(
  { 
    id: "embed-batch", 
    name: "Embed Document Chunks Batch",
    // Concurrency controls could be added here to prevent overwhelming the local Ollama instance
    concurrency: {
      limit: 2, // Maximum 2 concurrent embedding batches
    }
  },
  { event: "knowledge/embed.batch" },
  async ({ event, step }: any) => {
    const { sourceId, syncJobId, chunkIds } = event.data;

    // 1. Check if sync job was cancelled
    const isActive = await step.run("check-status", async () => {
      const job = await db.select({ status: syncJobs.status }).from(syncJobs).where(eq(syncJobs.id, syncJobId)).limit(1);
      return job[0]?.status !== "cancelled";
    });

    if (!isActive) {
      return { status: "cancelled", message: "Job was cancelled, halting embedding." };
    }

    // 2. Fetch chunks that need embeddings
    const chunks = await step.run("fetch-chunks", async () => {
      return await db.select()
        .from(documentChunks)
        .where(inArray(documentChunks.id, chunkIds));
    });

    if (chunks.length === 0) {
      return { status: "completed", message: "No chunks found or all already processed." };
    }

    // 3. Generate embeddings
    let successCount = 0;
    
    // We could batch further here or just process sequentially per step
    for (const chunk of chunks) {
      if (chunk.embedding) {
        successCount++;
        continue; // Skip if already embedded (idempotency)
      }

      await step.run(`embed-chunk-${chunk.id}`, async () => {
        try {
          const vector = await generateEmbedding(chunk.content);
          await db.update(documentChunks)
            .set({ embedding: vector })
            .where(eq(documentChunks.id, chunk.id));
        } catch (error) {
          console.error(`Failed to embed chunk ${chunk.id}:`, error);
          throw error; // Will trigger Inngest step retry
        }
      });
      successCount++;
    }

    // 4. Update progress
    await step.run("update-progress", async () => {
      // Safely increment embeddings generated count using raw SQL
      await db.execute(sql`
        UPDATE knowledge_sources 
        SET embeddings_generated = embeddings_generated + ${successCount}
        WHERE id = ${sourceId}
      `);

      await db.execute(sql`
        UPDATE sync_jobs 
        SET progress = jsonb_set(
          COALESCE(progress, '{}'::jsonb),
          '{generated_embeddings}',
          (COALESCE((progress->>'generated_embeddings')::int, 0) + ${successCount})::text::jsonb
        )
        WHERE id = ${syncJobId}
      `);
    });

    // 5. Check if all chunks for this source are done
    await step.run("check-completion", async () => {
      // Find chunks belonging to this source's documents that lack embeddings
      const remainingResult = await db.execute(sql`
        SELECT COUNT(dc.id) as remaining
        FROM document_chunks dc
        JOIN documents d ON dc.document_id = d.id
        WHERE d.source_id = ${sourceId} AND dc.embedding IS NULL
      `);
      const remaining = Number(remainingResult.rows[0]?.remaining || 0);

      if (remaining === 0) {
        await db.execute(sql`
          UPDATE sync_jobs 
          SET status = 'completed', finished_at = NOW() 
          WHERE id = ${syncJobId}
        `);
        await db.execute(sql`
          UPDATE knowledge_sources 
          SET sync_status = 'success', last_successful_sync_at = NOW() 
          WHERE id = ${sourceId}
        `);
      }
    });

    return { status: "completed", processed: successCount };
  }
);




