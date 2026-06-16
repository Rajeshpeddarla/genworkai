import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import * as handlers from './handlers';

export function registerTools(server: McpServer) {

  // --- LAYER 0: SOURCES ---
  server.tool("list_sources", "List all available raw sources (GitHub, Folders, DBs)", 
    {
      kbId: z.number().describe("The Knowledge Base ID to filter sources by"),
    },
    async (args, extra) => await handlers.listSources(args.kbId, extra)
  );

  server.tool("get_source", "Retrieve details about a specific source", 
    {
      sourceId: z.number().describe("The specific Source ID"),
    },
    async (args, extra) => await handlers.getSource(args.sourceId, extra)
  );

  server.tool("refresh_source", "Trigger a sync/refresh of a source", 
    {
      sourceId: z.number().describe("The specific Source ID"),
    },
    async (args, extra) => await handlers.refreshSource(args.sourceId, extra)
  );


  // --- LAYER 1: KNOWLEDGE ---
  server.tool("list_knowledge_bases", "List all available Knowledge Bases", 
    {},
    async (args, extra) => await handlers.listKnowledgeBases(extra)
  );

  server.tool("search_knowledge", "Search documents and chunks across knowledge bases", 
    {
      query: z.string().describe("The semantic search query"),
      kbId: z.number().optional().describe("Optional Knowledge Base ID to filter by"),
    },
    async (args, extra) => await handlers.searchKnowledge(args.query, args.kbId, extra)
  );

  server.tool("get_architecture_view", "Retrieve the architectural tree (L1-L5)", 
    {
      kbId: z.number().describe("The Knowledge Base ID"),
    },
    async (args, extra) => await handlers.getArchitectureView(args.kbId, extra)
  );

  // --- LAYER 2: FEATURES & FLOWS ---
  server.tool("list_features", "List business logic features", 
    {
      kbId: z.number().describe("The Knowledge Base ID"),
    },
    async (args, extra) => await handlers.listFeatures(args.kbId, extra)
  );

  server.tool("get_feature", "Get detailed feature information, including associated flows and artifacts", 
    {
      featureId: z.number().describe("The Feature ID"),
    },
    async (args, extra) => await handlers.getFeature(args.featureId, extra)
  );

  server.tool("list_flows", "List business logic flows", 
    {
      kbId: z.number().describe("The Knowledge Base ID"),
    },
    async (args, extra) => await handlers.listFlows(args.kbId, extra)
  );

  server.tool("get_flow", "Get detailed steps for a business flow", 
    {
      flowId: z.number().describe("The Flow ID"),
    },
    async (args, extra) => await handlers.getFlow(args.flowId, extra)
  );

  server.tool("create_flow", "Create a new business flow", 
    {
      kbId: z.number().describe("The Knowledge Base ID"),
      name: z.string(),
      description: z.string(),
      steps: z.array(z.object({
        stepName: z.string(),
        description: z.string()
      }))
    },
    async (args, extra) => await handlers.createFlow(args, extra)
  );

  // --- LAYER 3: ARTIFACT GENERATION ---
  server.tool("generate_architecture_doc", "Generate architecture documentation based on features", 
    {
      featureIds: z.array(z.number()).describe("List of feature IDs to include"),
    },
    async (args, extra) => await handlers.generateArtifactTemplate("architecture", args.featureIds, extra)
  );

  server.tool("generate_api_docs", "Generate API documentation based on features", 
    {
      featureIds: z.array(z.number()).describe("List of feature IDs to include"),
    },
    async (args, extra) => await handlers.generateArtifactTemplate("api", args.featureIds, extra)
  );

  server.tool("generate_postman_collection", "Generate a Postman collection for the features", 
    {
      featureIds: z.array(z.number()).describe("List of feature IDs to include"),
    },
    async (args, extra) => await handlers.generateArtifactTemplate("postman", args.featureIds, extra)
  );

  server.tool("generate_test_plan", "Generate a QA Test Plan for specific features and flows", 
    {
      featureIds: z.array(z.number()).describe("List of feature IDs"),
      flowIds: z.array(z.number()).describe("List of flow IDs"),
    },
    async (args, extra) => await handlers.generateArtifactTemplate("test_plan", [...args.featureIds, ...args.flowIds], extra)
  );

  // --- LAYER 4: WORKSPACE OPERATIONS ---
  server.tool("list_artifacts", "List artifacts in a workspace", 
    {
      chatId: z.number().describe("The Workspace Session/Chat ID"),
    },
    async (args, extra) => await handlers.listArtifacts(args.chatId, extra)
  );

  server.tool("get_artifact", "Retrieve artifact content", 
    {
      artifactId: z.number().describe("The Artifact ID"),
    },
    async (args, extra) => await handlers.getArtifact(args.artifactId, extra)
  );

  // --- LAYER 5: DATABASE INTELLIGENCE ---
  server.tool("get_database_schema", "Retrieve the schema for a connected database", 
    {
      databaseId: z.number().describe("The connected database ID"),
    },
    async (args, extra) => await handlers.getDatabaseSchema(args.databaseId, extra)
  );

  server.tool("query_database", "Execute a read-only SQL query against a database", 
    {
      databaseId: z.number().describe("The connected database ID"),
      query: z.string().describe("The SQL query (SELECT only)"),
    },
    async (args, extra) => await handlers.queryDatabase(args.databaseId, args.query, extra)
  );

  // --- LAYER 6: AUTOMATION STUDIO ---
  server.tool("create_task", "Create a new automation task", 
    {
      name: z.string(),
      goal: z.string(),
      sourceId: z.number().optional(),
      schedule: z.string().optional()
    },
    async (args, extra) => await handlers.createAutomationTask(args, extra)
  );

  server.tool("run_task", "Manually trigger an automation task", 
    {
      taskId: z.number()
    },
    async (args, extra) => await handlers.triggerAutomationTask(args.taskId, extra)
  );
}
