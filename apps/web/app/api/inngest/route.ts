import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";
import { runAutomationTask } from "../../../inngest/functions/runAutomationTask";

import { githubIngestion } from "../../../inngest/functions/ingestion/githubIngestion";
import { websiteIngestion } from "../../../inngest/functions/ingestion/websiteIngestion";
import { databaseIngestion } from "../../../inngest/functions/ingestion/databaseIngestion";
import { folderIngestion } from "../../../inngest/functions/ingestion/folderIngestion";
import { apiIngestion } from "../../../inngest/functions/ingestion/apiIngestion";
import { uploadIngestion } from "../../../inngest/functions/ingestion/uploadIngestion";
import { embedBatch } from "../../../inngest/functions/ingestion/embedBatch";
import { cronMonthlyRefill } from "../../../inngest/functions/cronMonthlyRefill";

// Create an API that serves zero-config routing for Inngest
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    runAutomationTask,
    githubIngestion,
    websiteIngestion,
    databaseIngestion,
    folderIngestion,
    apiIngestion,
    uploadIngestion,
    embedBatch,
    cronMonthlyRefill,
  ],
});
