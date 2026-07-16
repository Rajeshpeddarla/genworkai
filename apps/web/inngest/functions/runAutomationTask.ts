// @ts-nocheck
import { inngest } from "../client";
import { db } from "../../db";
import { automationTasks, automationLogs, workspaceArtifacts, workspaceArtifactVersions } from "../../db/schema";
import { eq } from "drizzle-orm";
import { generateText } from "ai";
import { createDeepSeek } from "@ai-sdk/deepseek";

const openai = createDeepSeek({
  apiKey: process.env.GEMINI_API_KEY || "",
  baseURL: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
});

async function executeLLM(task: any, systemPrompt: string) {
  if (!process.env.GEMINI_API_KEY) {
    return `# LLM Disabled\n\nNo DEEPSEEK_API_KEY found in the environment. Task: ${task.name}\nGoal: ${task.goal}`;
  }

  const result = await generateText({
    model: openai(process.env.DEEPSEEK_MODEL || "gpt-4o"),
    system: systemPrompt,
    prompt: `Execute the following automation task:\n\nTask Name: ${task.name}\nDescription: ${task.description || "None"}\nGoal: ${task.goal || "None"}\nTarget Artifact Types: ${task.artifactTypes?.join(", ") || "None"}\nSources: ${task.sources?.join(", ") || "None"}\n\nPlease generate the required output artifact contents. Format as pure Markdown.`,
  });
  
  return result.text;
}

async function runKnowledgeTask(task: any, step: any) {
  return await step.run("run-knowledge-task", async () => {
    return await executeLLM(task, "You are a Knowledge Management AI. Process the requested materials, extract key learnings, and synthesize a comprehensive educational or summary document based on the user's goal.");
  });
}

async function runDocumentationTask(task: any, step: any) {
  return await step.run("run-documentation-task", async () => {
    return await executeLLM(task, "You are a Technical Writer AI. Generate SOPs, technical guides, architectural reviews, or API documentation based on the goal provided.");
  });
}

async function runDeveloperTask(task: any, step: any) {
  return await step.run("run-developer-task", async () => {
    return await executeLLM(task, "You are a Principal Software Engineer. Write deep technical reviews, unit test assets, or architecture release summaries.");
  });
}

async function runDatabaseTask(task: any, step: any) {
  return await step.run("run-database-task", async () => {
    return await executeLLM(task, "You are a Data Engineering AI. Formulate data quality reports, SQL schema audit notes, or analytics summaries.");
  });
}

async function runMonitoringTask(task: any, step: any) {
  return await step.run("run-monitoring-task", async () => {
    return await executeLLM(task, "You are a Site Reliability Engineer AI. Formulate system impact analysis, outage post-mortems, or general monitoring reports.");
  });
}

async function runWorkspaceTask(task: any, step: any) {
  return await step.run("run-workspace-task", async () => {
    return await executeLLM(task, "You are an Executive AI Assistant. Create a polished workspace artifact fulfilling the user's specific workflow goal.");
  });
}

// @ts-ignore - Ignore type signature mismatch for MVP Inngest v4
export const runAutomationTask: any = inngest.createFunction(
  { 
    id: "run-automation-task", 
    name: "Run Automation Task",
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

    // 1.5 Check AI Credits
    await step.run("check-ai-credits", async () => {
      const { EntitlementEngine } = await import('../../lib/billing/entitlements');
      const creditCheck = await EntitlementEngine.checkLimit({ userId: task.userId, resource: 'ai_credits', incrementAmount: 3 });
      if (!creditCheck.allowed) {
        throw new Error(creditCheck.reason || "Insufficient AI Credits to run automation.");
      }
    });

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
          category: "automation_artifact",
          status: "published",
        }).returning({ id: workspaceArtifacts.id });
        
        const createdArtifactId = newArtifact[0]!.id;

        await db.insert(workspaceArtifactVersions).values({
          artifactId: createdArtifactId,
          versionNumber: 1,
          content: generatedContent,
          sourceDocIds: [],
        });

        return createdArtifactId;
      });

      // 6. Complete Log and Deduct AI Credit
      await step.run("complete-log", async () => {
        const { UsageService } = await import('../../lib/billing/UsageService');
        const taskCostKey = task.templateId || ('automation_task_' + task.category);
        
        await UsageService.consumeCredits(task.userId, 'automation_base').catch(e => console.error("Failed to deduct base AI credit:", e));
        await UsageService.consumeCredits(task.userId, taskCostKey).catch(e => console.error("Failed to deduct task AI credit:", e));
        await UsageService.consumeCredits(task.userId, 'automation_generated_artifact').catch(e => console.error("Failed to deduct artifact AI credit:", e));

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
