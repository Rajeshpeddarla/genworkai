// @ts-nocheck
import { inngest } from '../client';
import { db } from '@/db';
import { automationTasks, automationLogs, workspaceArtifacts, connectedDatabases } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { Client } from 'pg';
import mysql from 'mysql2/promise';
import { generateText } from 'ai';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { decryptSecret, isEncrypted } from '@/lib/security/encryption';

const deepseek = createDeepSeek({
  apiKey: process.env.GEMINI_API_KEY || "",
});

export const cronDatabaseAutomations: any = inngest.createFunction(
  { id: 'cron-database-automations', triggers: [{ cron: '0 * * * *' }] },
  async ({ step }: { step: any }) => {
    // 1. Fetch all active scheduled tasks that are due
    // For simplicity in V1, we'll run this check and execute tasks based on their schedule string
    // In a production system, we'd calculate nextRunAt more precisely.
    const activeTasks = await step.run('fetch-due-tasks', async () => {
      // Find all active database automations
      return await db.query.automationTasks.findMany({
        where: and(
          eq(automationTasks.status, 'active'),
          eq(automationTasks.category, 'database'),
          eq(automationTasks.executionMode, 'scheduled')
        )
      });
    });

    for (const task of activeTasks) {
      await step.sendEvent(`trigger-db-task-${task.id}`, {
        name: 'automation.database.run',
        data: { taskId: task.id }
      });
    }

    return { triggered: activeTasks.length };
  }
);

export const runDatabaseAutomation: any = inngest.createFunction(
  { id: 'run-database-automation', triggers: [{ event: 'automation.database.run' }] },
  async ({ event, step }: { event: any, step: any }) => {
    const { taskId } = event.data;

    // Fetch the task
    const task = await step.run('fetch-task', async () => {
      return await db.query.automationTasks.findFirst({
        where: eq(automationTasks.id, taskId)
      });
    });

    if (!task) throw new Error('Task not found');
    
    // Create initial log
    const logId = await step.run('create-log', async () => {
      const [log] = await db.insert(automationLogs).values({
        taskId: task.id,
        status: 'running',
        startedAt: new Date()
      }).returning({ id: automationLogs.id });
      return log?.id;
    });

    try {
      if (!task.sqlQuery) throw new Error('No SQL query provided');
      if (!task.sources || !task.sources[0]?.id) throw new Error('No database source selected');

      const dbId = parseInt(task.sources[0].id as string);
      
      const conn = await step.run('fetch-connection', async () => {
        return await db.query.connectedDatabases.findFirst({
          where: eq(connectedDatabases.id, dbId)
        });
      });

      if (!conn) throw new Error('Connected database not found');

      // Execute SQL
      const queryResult = await step.run('execute-sql', async () => {
        const query = task.sqlQuery!;
        
        // Final safety check
        const lowerQuery = query.toLowerCase();
        if (['insert ', 'update ', 'delete ', 'drop ', 'alter ', 'truncate ', 'create '].some(kw => lowerQuery.includes(kw))) {
          throw new Error('Unsafe query detected. Execution aborted.');
        }

        if (conn.engine === 'pg') {
          const decryptedPassword = isEncrypted(conn.password!) ? decryptSecret(conn.password!) : conn.password!;
          const client = new Client({
            host: conn.host!,
            port: conn.port!,
            database: conn.databaseName!,
            user: conn.username!,
            password: decryptedPassword
          });
          await client.connect();
          try {
            const res = await client.query(query);
            return res.rows;
          } finally {
            await client.end();
          }
        } else if (conn.engine === 'mysql') {
          const decryptedPassword = isEncrypted(conn.password!) ? decryptSecret(conn.password!) : conn.password!;
          const connection = await mysql.createConnection({
            host: conn.host!,
            port: conn.port!,
            user: conn.username!,
            password: decryptedPassword,
            database: conn.databaseName!
          });
          try {
            const [rows] = await connection.execute(query);
            return rows;
          } finally {
            await connection.end();
          }
        } else {
          throw new Error(`Unsupported engine: ${conn.engine}`);
        }
      });

      // Sample/Normalize Data to save tokens (Max 50 rows for AI)
      const dataStr = await step.run('normalize-data', async () => {
        const rows = Array.isArray(queryResult) ? queryResult : [];
        const sample = rows.slice(0, 50);
        return JSON.stringify({
          totalRowsReturned: rows.length,
          sampleDisplayed: sample.length,
          data: sample
        }, null, 2);
      });

      // AI Analysis
      const aiResponse = await step.run('ai-analysis', async () => {
        const systemPrompt = task.goal || 'You are a data analyst. Analyze this data and create a Markdown report.';
        
        const { text, usage } = await generateText({
          model: deepseek(process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash'),
          system: systemPrompt,
          prompt: `Here is the scheduled database query result:\n\nQuery:\n${task.sqlQuery}\n\nResult:\n${dataStr}\n\nPlease generate the markdown report now.\n\nCRITICAL INSTRUCTION: You are running as an automated background job. Your output must have a highly consistent, predictable structure on every execution. Do not add varied conversational filler. Use the exact same formatting, tables, and headings every time, only updating the data values.`,
          temperature: 0
        });
        
        return { text, usage };
      });

      // Create Workspace Artifact
      const artifactId = await step.run('create-artifact', async () => {
        const dateStr = new Date().toISOString().split('T')[0];
        const name = `${task.name} Report - ${dateStr}`;
        const [artifact] = await db.insert(workspaceArtifacts).values({
          name: name,
          fileType: 'markdown',
          category: 'automation_report'
        }).returning({ id: workspaceArtifacts.id });
        
        if (artifact?.id) {
          await db.insert(require('@/db/schema').workspaceArtifactVersions).values({
            artifactId: artifact.id,
            versionNumber: 1,
            content: aiResponse.text
          });
          return artifact.id;
        }
        return null;
      });

      // Mark success
      await step.run('mark-success', async () => {
        await db.update(automationLogs)
          .set({
            status: 'success',
            finishedAt: new Date(),
            durationMs: Date.now() - new Date().getTime(), // Approximate
            artifactId: artifactId,
            sqlExecuted: task.sqlQuery,
            inputTokens: aiResponse.usage.promptTokens,
            outputTokens: aiResponse.usage.completionTokens
          })
          .where(eq(automationLogs.id, logId));
          
        await db.update(automationTasks)
          .set({ 
            lastRunAt: new Date(),
            totalRuns: sql`${automationTasks.totalRuns} + 1`
          })
          .where(eq(automationTasks.id, task.id));
      });

      return { success: true, artifactId };

    } catch (e: any) {
      // Mark failure
      await step.run('mark-failure', async () => {
        await db.update(automationLogs)
          .set({
            status: 'failed',
            finishedAt: new Date(),
            errorDetails: e.message
          })
          .where(eq(automationLogs.id, logId));
          
        await db.update(automationTasks)
          .set({ lastFailureAt: new Date() })
          .where(eq(automationTasks.id, task.id));
      });
      throw e;
    }
  }
);
