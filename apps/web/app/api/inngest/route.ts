export const dynamic = "force-dynamic";
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
import { cronDatabaseAutomations, runDatabaseAutomation } from "../../../inngest/functions/cronDatabaseAutomations";
import { cronDashboardWidgets } from "../../../inngest/functions/cronDashboardWidgets";

// New V3 Multimodal Knowledge Pipeline Workers
import { extractWorker } from "../../../inngest/functions/knowledge/extract";
import { renderWorker } from "../../../inngest/functions/knowledge/render";
import { chunkWorker } from "../../../inngest/functions/knowledge/chunk";
import { embedWorker } from "../../../inngest/functions/knowledge/embed";
import { graphWorker } from "../../../inngest/functions/knowledge/graph";

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
    cronDatabaseAutomations,
    runDatabaseAutomation,
    cronDashboardWidgets,
    
    // V3 Knowledge Pipeline
    extractWorker,
    renderWorker,
    chunkWorker,
    embedWorker,
    graphWorker,
  ],
});
