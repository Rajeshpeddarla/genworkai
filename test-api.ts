import { db } from './apps/web/db/index.js';
import { automationTasks } from './apps/web/db/schema.js';
import { eq, and } from 'drizzle-orm';
import { inngest } from './apps/web/inngest/client.js';

async function test() {
  try {
    const taskId = 1;
    // Just find any task to test the query
    const task = await db.query.automationTasks.findFirst({
      where: eq(automationTasks.id, taskId)
    });
    console.log("Task:", task?.name);

    if (task) {
      console.log("Triggering inngest...");
      await inngest.send({
        name: 'automation.task.run',
        data: { taskId }
      });
      console.log("Inngest triggered successfully.");
    }
  } catch (e) {
    console.error("ERROR:", e);
  }
}
test();
