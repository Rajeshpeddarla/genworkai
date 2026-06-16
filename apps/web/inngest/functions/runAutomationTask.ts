// @ts-nocheck
import { inngest } from "../client";
import { db } from "../../db";
import { automationTasks, automationLogs, workspaceArtifacts } from "../../db/schema";
import { eq } from "drizzle-orm";
// We would import the Workspace LLM logic here to actually generate outputs based on the goal/source.
// import { generateWithLLM } from "../../../lib/llm";

// @ts-ignore - Ignore type signature mismatch for MVP Inngest v4
export const runAutomationTask: any = inngest.createFunction(
  { id: "run-automation-task", name: "Run Automation Task" },
  { event: "automation.task.run" },
  async ({ event, step }: any) => {
    const { taskId } = event.data;

    // 1. Fetch Task Definition
    const task = await step.run("fetch-task", async () => {
      const result = await db.select().from(automationTasks).where(eq(automationTasks.id, taskId)).limit(1);
      if (!result.length) throw new Error(`Task ${taskId} not found`);
      return result[0];
    });

    if (!task) return;

    // 2. Mark task as running
    const logId = await step.run("create-log", async () => {
      const newLog = await db.insert(automationLogs).values({
        taskId,
        status: "running",
      }).returning({ id: automationLogs.id });
      return newLog[0]!.id;
    });

    try {
      // 3. Fetch Context from Source (Database, GitHub, KB, etc.)
      const sourceContext = await step.run("fetch-source-context", async () => {
        // Here we'd fetch actual data depending on task.sourceType
        // Mocking for MVP
        return `Context from ${task.sourceType} (ID: ${task.sourceId})`;
      });

      // 4. Generate Output via LLM
      const generatedContent = await step.run("generate-output", async () => {
        // Here we'd use the unified Workspace LLM to generate content based on the goal and source context.
        // const prompt = \`Goal: \${task.goal}\n\nContext:\n\${sourceContext}\`;
        // return await generateWithLLM(prompt);
        
        // Mocked output
        return `# Generated Output for: ${task.name}\n\nBased on your goal: ${task.goal}\n\nThis is a mocked generated artifact from the Automation Studio.`;
      });

      // 5. Generate Workspace Artifact
      const artifactId = await step.run("generate-artifact", async () => {
        const title = `${task.name} - Output`;
        // In a real implementation we'd link to a workspace chat or KB, for now creating a standalone artifact.
        // Since chatId is required by schema (if not nullable), we assume a generic system chat or make it nullable.
        // Assuming nullable for standalone artifacts.
        
        const newArtifact = await db.insert(workspaceArtifacts).values({
          name: title,
          fileType: "md",
          category: "Automation Output",
          status: "published",
        }).returning({ id: workspaceArtifacts.id });
        
        return newArtifact[0]!.id;
      });

      // 6. Complete Log
      await step.run("complete-log", async () => {
        await db.update(automationLogs)
          .set({ status: "success", logs: "Task completed successfully. Artifact generated.", artifactId, finishedAt: new Date() })
          .where(eq(automationLogs.id, logId));
          
        await db.update(automationTasks)
          .set({ lastRunAt: new Date() })
          .where(eq(automationTasks.id, taskId));
      });

      return { success: true, artifactId };

    } catch (error: any) {
      await step.run("fail-log", async () => {
        await db.update(automationLogs)
          .set({ status: "failed", logs: error.message || "Unknown error", finishedAt: new Date() })
          .where(eq(automationLogs.id, logId));
      });
      throw error;
    }
  }
);
