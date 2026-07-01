import { config } from 'dotenv';
config({ path: '.env.local' });

const costs = [
  { operationKey: 'workspace_chat', displayName: 'Workspace Chat', credits: 1, category: 'chat', description: 'Standard AI conversation in a Workspace' },
  { operationKey: 'knowledge_chat', displayName: 'Knowledge Chat', credits: 1, category: 'chat', description: 'AI conversation with Knowledge Bases' },
  { operationKey: 'database_chat', displayName: 'Database Chat', credits: 1, category: 'chat', description: 'AI querying a Database' },
  { operationKey: 'developer_api', displayName: 'Developer API', credits: 1, category: 'api', description: 'External API access' },
  { operationKey: 'summary_generation', displayName: 'Summary Generation', credits: 2, category: 'document', description: 'Generate a text summary' },
  { operationKey: 'quiz_generation', displayName: 'Quiz Generation', credits: 2, category: 'document', description: 'Generate a quiz' },
  { operationKey: 'document_generation', displayName: 'Document Generation', credits: 5, category: 'document', description: 'Generate a document (PDF, Word, Markdown, etc.)' },
  { operationKey: 'file_upscale', displayName: 'AI Image Upscale', credits: 5, category: 'analysis', description: 'Upscale an image' },
  { operationKey: 'file_compress', displayName: 'AI Image Compress', credits: 2, category: 'analysis', description: 'Compress an image' },
  { operationKey: 'file_resize', displayName: 'AI Image Resize', credits: 2, category: 'analysis', description: 'Resize an image' },
  { operationKey: 'file_convert', displayName: 'AI File Convert', credits: 2, category: 'analysis', description: 'Convert file formats' },
  { operationKey: 'file_remove_bg', displayName: 'AI Remove Background', credits: 4, category: 'analysis', description: 'Remove background from image' },
  { operationKey: 'architecture_generation', displayName: 'Architecture Report', credits: 5, category: 'analysis', description: 'Generate an architecture report' },
  { operationKey: 'github_analysis', displayName: 'GitHub Analysis', credits: 5, category: 'analysis', description: 'Analyze a GitHub repository' },
  { operationKey: 'repository_analysis', displayName: 'Repository Analysis', credits: 5, category: 'analysis', description: 'Analyze a local repository' },
  { operationKey: 'database_schema_scan', displayName: 'Database Schema Scan', credits: 5, category: 'analysis', description: 'Extract schema from a Database' },
  { operationKey: 'knowledge_ingestion', displayName: 'Knowledge Ingestion', credits: 10, category: 'ingestion', description: 'Process and vectorise large knowledge bases' },
  { operationKey: 'automation_base', displayName: 'Automation Run', credits: 2, category: 'automation', description: 'Base cost for running an automation' },
  { operationKey: 'semantic_search', displayName: 'Semantic Search', credits: 1, category: 'search', description: 'Run a semantic search against Knowledge Bases' },
  { operationKey: 'flashcards_generation', displayName: 'Flashcards Generation', credits: 2, category: 'document', description: 'Generate flashcards' },
  { operationKey: 'ocr', displayName: 'OCR', credits: 1, category: 'analysis', description: 'Optical Character Recognition' },
  { operationKey: 'image_analysis', displayName: 'Image Analysis', credits: 2, category: 'analysis', description: 'AI Image Analysis' },
  { operationKey: 'automation_generated_artifact', displayName: 'Automation Artifact', credits: 1, category: 'automation', description: 'Cost per generated artifact during an automation' },
  { operationKey: 'mcp_tool_call', displayName: 'MCP Tool Execution', credits: 1, category: 'api', description: 'Cost per MCP tool invocation' },
  { operationKey: 'mcp_creation', displayName: 'MCP Server Creation', credits: 0, category: 'management', description: 'Create an MCP Server' },
  { operationKey: 'api_key_creation', displayName: 'API Key Creation', credits: 0, category: 'management', description: 'Create an API Key' },
  { operationKey: 'knowledge_base_creation', displayName: 'Knowledge Base Creation', credits: 0, category: 'management', description: 'Create a Knowledge Base' },
  { operationKey: 'database_connection', displayName: 'Database Connection', credits: 0, category: 'management', description: 'Connect a Database' }
];

async function main() {
  console.log("Seeding AI Credit Costs...");
  const { db } = await import("../db/index");
  const { aiCreditCosts } = await import("../db/schema");
  const { eq } = await import("drizzle-orm");
  const { inArray } = await import("drizzle-orm");

  const obsoleteKeys = [
    'markdown_generation', 'md_generation', 'docx_generation', 
    'pdf_generation', 'spreadsheet_generation', 'presentation_generation', 'ppt_generation'
  ];
  await db.delete(aiCreditCosts).where(inArray(aiCreditCosts.operationKey, obsoleteKeys));
  console.log("Deleted obsolete document generation keys.");

  for (const cost of costs) {
    const existing = await db.query.aiCreditCosts.findFirst({
      where: eq(aiCreditCosts.operationKey, cost.operationKey)
    });
    
    if (!existing) {
      await db.insert(aiCreditCosts).values(cost);
      console.log(`Inserted: ${cost.operationKey}`);
    } else {
      await db.update(aiCreditCosts).set(cost).where(eq(aiCreditCosts.operationKey, cost.operationKey));
      console.log(`Updated: ${cost.operationKey}`);
    }
  }
  
  console.log("Seeding complete.");
  process.exit(0);
}

main().catch(console.error);
