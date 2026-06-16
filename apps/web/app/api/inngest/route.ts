import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";
import { runAutomationTask } from "../../../inngest/functions/runAutomationTask";

// Create an API that serves zero-config routing for Inngest
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    runAutomationTask,
  ],
});
