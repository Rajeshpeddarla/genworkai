// @ts-nocheck
import { inngest } from "../client";
import { db } from "../../db";
import { automationTasks, automationLogs, workspaceArtifacts } from "../../db/schema";
import { eq } from "drizzle-orm";

async function runKnowledgeTask(task: any, step: any) {
  return await step.run("run-knowledge-task", async () => {
    return `# Knowledge Output for ${task.name}\n\nProcessed learning materials from knowledge base.`;
  });
}

async function runDocumentationTask(task: any, step: any) {
  return await step.run("run-documentation-task", async () => {
    return `# Documentation Update\n\nGenerated SOPs and Technical Guides based on GitHub & APIs.`;
  });
}

async function runDeveloperTask(task: any, step: any) {
  return await step.run("run-developer-task", async () => {
    return `# Developer Report\n\nTest assets, architecture review, and release summaries generated.`;
  });
}

async function runDatabaseTask(task: any, step: any) {
  return await step.run("run-database-task", async () => {
    return `# Database Audit\n\nData quality reports and operational reports generated.`;
  });
}

async function runMonitoringTask(task: any, step: any) {
  return await step.run("run-monitoring-task", async () => {
    return `# Monitoring Alert\n\nSystem impact analysis and change detection complete.`;
  });
}

async function runWorkspaceTask(task: any, step: any) {
  return await step.run("run-workspace-task", async () => {
    return `# Custom Workspace Artifact\n\nArtifact generated from workspace sources.`;
  });
}

// @ts-ignore - Ignore type signature mismatch for MVP Inngest v4
export const runAutomationTask: any = inngest.createFunction(
  { 
    id: "run-automation-task", 
    name: "Run Automation Task",
    // @ts-ignore
    triggers: [{ event: "automation.task.run" }] 
  },
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
      // 3. Create Source Snapshot
      const sourceSnapshot = await step.run("create-snapshot", async () => {
        // In reality, this would fetch the current hash/version of the source.
        return {
          timestamp: new Date().toISOString(),
          sources: task.sources || [],
          mockedVersion: "v1.0-" + Date.now()
        };
      });

      // 4. Dispatch to handler
      let generatedContent = "";
      switch (task.category) {
        case "knowledge":
          generatedContent = await runKnowledgeTask(task, step);
          break;
        case "documentation":
          generatedContent = await runDocumentationTask(task, step);
          break;
        case "developer":
          generatedContent = await runDeveloperTask(task, step);
          break;
        case "database":
          generatedContent = await runDatabaseTask(task, step);
          break;
        case "monitoring":
          generatedContent = await runMonitoringTask(task, step);
          break;
        case "workspace":
        default:
          generatedContent = await runWorkspaceTask(task, step);
          break;
      }

      // 5. Generate Workspace Artifacts
      const artifactTypes = task.artifactTypes || ["document"];
      const primaryType = artifactTypes[0]; // Just use the first requested type for the MVP file extension mapping
      
      let fileExt = "md";
      if (primaryType === "spreadsheet") fileExt = "xlsx";
      if (primaryType === "presentation") fileExt = "pptx";
      if (primaryType === "report" || primaryType === "assessment") fileExt = "pdf";

      const artifactId = await step.run("generate-artifact", async () => {
        const title = `${task.name} - Output`;
        
        const newArtifact = await db.insert(workspaceArtifacts).values({
          name: title,
          fileType: fileExt,
          category: "Automation Output",
          status: "published",
        }).returning({ id: workspaceArtifacts.id });
        
        return newArtifact[0]!.id;
      });

      // 6. Complete Log
      await step.run("complete-log", async () => {
        await db.update(automationLogs)
          .set({ 
            status: "success", 
            logs: `Task completed successfully. Artifact [${fileExt}] generated via ${task.category} handler.`, 
            artifactId, 
            sourceSnapshot,
            finishedAt: new Date() 
          })
          .where(eq(automationLogs.id, logId));
          
        await db.update(automationTasks)
          .set({ lastRunAt: new Date(), status: "active" })
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
