import { inngest } from "../../client";
import { db } from "../../../db";
import { documents, documentChunks, knowledgeSources, syncJobs, sourceSnapshots, databaseSchemas, connectedDatabases } from "../../../db/schema";
import { eq, sql } from "drizzle-orm";
import crypto from 'crypto';
import { enhanceTextWithAI, smartChunkMarkdown, extractRelationships, generateChunkHash } from "../../../lib/knowledge-pipeline";

export const databaseIngestion: any = inngest.createFunction(
  { id: "ingest-database", name: "Ingest Database Schema", triggers: [{ event: "knowledge/process.database" }] },
  async ({ event, step }: any) => {
    const { sourceId, syncJobId, connectedDbId, engine, finalDatabaseName } = event.data;

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
      await updateProgress("fetching", { stage: "fetching", current_step: "Retrieving cached schema" });

      const schemaRecord = await step.run("get-schema", async () => {
        const res = await db.select().from(databaseSchemas).where(eq(databaseSchemas.databaseId, connectedDbId)).orderBy(sql`${databaseSchemas.extractedAt} DESC`).limit(1);
        return res[0];
      });

      if (!schemaRecord) throw new Error("Schema not found in databaseSchemas table");
      const rawSchema = schemaRecord.schemaData as any;

      let schemaDefinition = `# Database Schema (${engine})\n\n`;
      if (engine === 'mongodb') {
        schemaDefinition += `## Collections\n`;
        for (const coll of rawSchema.collections || []) {
          schemaDefinition += `- ${coll}\n`;
        }
      } else if (rawSchema.__multiDb) {
        for (const [dbName, tables] of Object.entries(rawSchema.databases)) {
          schemaDefinition += `# Database: ${dbName}\n\n`;
          for (const [tableName, columns] of Object.entries(tables as any)) {
            schemaDefinition += `## Table: ${dbName}.${tableName}\n| Column | Type |\n|---|---|\n`;
            for (const col of columns as any[]) {
              schemaDefinition += `| ${col.column} | ${col.type} |\n`;
            }
            schemaDefinition += `\n---\n`;
          }
        }
      } else {
        for (const [tableName, columns] of Object.entries(rawSchema)) {
          schemaDefinition += `## Table: ${tableName}\n| Column | Type |\n|---|---|\n`;
          for (const col of columns as any[]) {
            schemaDefinition += `| ${col.column} | ${col.type} |\n`;
          }
          schemaDefinition += `\n---\n`;
        }
      }

      const schemaHash = crypto.createHash('sha256').update(schemaDefinition).digest('hex');

      const shouldProcess = await step.run("check-idempotency", async () => {
        const source = await db.select({ lastSuccessfulHash: knowledgeSources.lastSuccessfulHash }).from(knowledgeSources).where(eq(knowledgeSources.id, sourceId)).limit(1);
        return source[0]?.lastSuccessfulHash !== schemaHash;
      });

      if (!shouldProcess) {
        await step.run("mark-success-unchanged", async () => {
          await db.update(syncJobs).set({ status: 'completed', finishedAt: new Date() }).where(eq(syncJobs.id, syncJobId));
          await db.update(knowledgeSources).set({ syncStatus: 'success', lastSyncAt: new Date(), lastSuccessfulSyncAt: new Date() }).where(eq(knowledgeSources.id, sourceId));
        });
        return { status: "skipped", reason: "Hash unchanged" };
      }

      await updateProgress("enhancing", { stage: "enhancing", current_step: "Applying AI enhancement" });

      const batchStats = await step.run("process-schema", async () => {
        const apiKey = process.env.GEMINI_API_KEY || '';
        const enhancedData = apiKey ? await enhanceTextWithAI(schemaDefinition, apiKey, undefined) : {
          summary: "Database Schema Definition", topics: ["Database", "Schema", "Tables"], keywords: ["SQL", "Database", "Schema"], classification: "Database Schema",
          knowledgeContent: schemaDefinition, embeddingContent: schemaDefinition
        };

        const relationships = extractRelationships(schemaDefinition, 'database');
        const sourceRecord = await db.select({ kbId: knowledgeSources.kbId }).from(knowledgeSources).where(eq(knowledgeSources.id, sourceId)).limit(1);
        
        const newDoc = await db.insert(documents).values({
          kbId: sourceRecord[0]?.kbId || 0,
          sourceId, title: 'Database Schema', sourceType: 'sql', sourceUrl: `db://${engine}/${finalDatabaseName}`,
          content: schemaDefinition, summary: enhancedData.summary,
          topics: enhancedData.topics, keywords: enhancedData.keywords, classification: enhancedData.classification,
          knowledgeContent: enhancedData.knowledgeContent, embeddingContent: enhancedData.embeddingContent,
          sizeBytes: Buffer.byteLength(schemaDefinition, 'utf8'),
          metadata: { originalName: 'schema.sql', processingStrategy: "3-artifact", relationships }
        }).returning({ id: documents.id });

        const docId = newDoc[0]!.id;
        const chunks = smartChunkMarkdown(enhancedData.embeddingContent || schemaDefinition);
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
        await db.update(knowledgeSources).set({ latestHash: schemaHash, lastSuccessfulHash: schemaHash, syncStatus: 'processing' }).where(eq(knowledgeSources.id, sourceId));
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


