import { NextResponse } from 'next/server';
import { db } from '../../../../../db';
import { documents, businessFeatures, businessFlows } from '../../../../../db/schema';
import { eq, and } from 'drizzle-orm';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: Request) {
  try {
    const { kbId } = await req.json();

    if (!kbId) {
      return NextResponse.json({ error: 'kbId is required' }, { status: 400, headers: corsHeaders });
    }

    const kbIdInt = parseInt(kbId, 10);
    const kbDocuments = await db.select().from(documents).where(eq(documents.kbId, kbIdInt));

    // Aggressively clear old features and flows to prevent mixed schema states from pre-V6.
    // Preserves manual overrides (custom flows/features created by the user).
    await db.delete(businessFeatures).where(and(eq(businessFeatures.kbId, kbIdInt), eq(businessFeatures.isManualOverride, false)));
    await db.delete(businessFlows).where(and(eq(businessFlows.kbId, kbIdInt), eq(businessFlows.isManualOverride, false)));

    // 1. Root Product
    const rootInsertion = await db.insert(businessFeatures).values({
      kbId: kbIdInt,
      name: 'GenWorkAI',
      description: '**Purpose:** The overarching operating system for agentic workflows.\n\n**Output:** A cohesive platform integrating research, workspace, and autonomous agents.',
      level: 'Product',
      documentIds: [],
      isManualOverride: false
    }).returning({ id: businessFeatures.id });
    const rootId = rootInsertion[0]!.id;

    // 2. Define Full Taxonomy Hierarchy (3 Levels deep)
    const taxonomy = [
      {
        name: 'Workspace',
        desc: '**Purpose:** To provide a central hub where users and agents collaborate on tasks.\n\n**Output:** Completed artifacts, edited documents, and executed tasks.',
        children: [
          { 
            name: 'Document Editing', desc: '**Purpose:** Allow users to manually refine AI-generated content.\n\n**Output:** Polished, human-approved documents.',
            children: [
              { name: 'Rich Text Engine', desc: '**Purpose:** Core markdown to WYSIWYG rendering layer.' },
              { name: 'Collaboration Sync', desc: '**Purpose:** Real-time multi-user cursor tracking and conflict resolution.' }
            ]
          },
          { 
            name: 'Live Preview', desc: '**Purpose:** Render code or markdown artifacts in real-time.\n\n**Output:** Visual feedback for generated UI components or reports.',
            children: [
              { name: 'Sandboxed IFrame', desc: '**Purpose:** Secure execution environment for generated React code.' },
              { name: 'Hot Module Replacement', desc: '**Purpose:** Instantly reflect code changes without full page reload.' }
            ]
          },
          { 
            name: 'Artifact Generation', desc: '**Purpose:** Translate abstract LLM thoughts into concrete files.\n\n**Output:** Downloadable assets (PDFs, TSX, Markdown).',
            children: [
              { name: 'AST Parser', desc: '**Purpose:** Convert raw LLM strings into abstract syntax trees for validation.' },
              { name: 'Asset Bundler', desc: '**Purpose:** Package CSS, JS, and HTML into distributable zip files.' }
            ]
          },
          { 
            name: 'Workspace Chat', desc: '**Purpose:** The primary communicative interface between the user and the agent.\n\n**Output:** Orchestration commands and conversational context.',
            children: [
              { name: 'Streaming SSE', desc: '**Purpose:** Maintain open connection for token-by-token LLM output.' },
              { name: 'Intent Classifier', desc: '**Purpose:** Route user prompts to the correct sub-agent tool.' }
            ]
          }
        ]
      },
      {
        name: 'Knowledge Base',
        desc: '**Purpose:** To manage, ingest, and index external context required by agents.\n\n**Output:** A semantic index of vectorized documents and structural graphs.',
        children: [
          { 
            name: 'Document Ingestion', desc: '**Purpose:** Parse external files (PDF, Code, DOCX) into text chunks.\n\n**Output:** Clean text ready for vector embeddings.',
            children: [
              { name: 'OCR Processor', desc: '**Purpose:** Extract text from scanned PDFs and images.' },
              { name: 'Chunking Engine', desc: '**Purpose:** Split documents into semantic 500-token blocks.' }
            ]
          },
          { 
            name: 'Business Architecture Graph', desc: '**Purpose:** Visualize the system so users understand the capabilities before the code.\n\n**Output:** Interactive capability trees and workflow DAGs.',
            children: [
              { name: 'Dagre Layout Engine', desc: '**Purpose:** Auto-arrange nodes to prevent edge crossings.' },
              { name: 'Node State Manager', desc: '**Purpose:** Track expanded/collapsed states and user drag positions.' }
            ]
          },
          { 
            name: 'Vector Search', desc: '**Purpose:** Retrieve semantically similar context during agent execution.\n\n**Output:** Highly relevant context injected into LLM prompts.',
            children: [
              { name: 'Cosine Similarity DB', desc: '**Purpose:** Query pgvector for closest embedding matches.' },
              { name: 'Re-ranking Model', desc: '**Purpose:** Re-order search results using Cross-Encoder for higher accuracy.' }
            ]
          }
        ]
      },
      {
        name: 'Research Studio',
        desc: '**Purpose:** Perform deep-dive, multi-step internet or database research.\n\n**Output:** Comprehensive research reports and structured data sets.',
        children: [
          { 
            name: 'Web Search Engine', desc: '**Purpose:** Browse the internet to find up-to-date information.\n\n**Output:** URLs, scraped text, and citations.',
            children: [
              { name: 'Headless Browser Crawler', desc: '**Purpose:** Execute JS on target pages to extract dynamic content.' },
              { name: 'Query Optimizer', desc: '**Purpose:** Expand user prompts into multiple Google search queries.' }
            ]
          },
          { 
            name: 'Data Synthesis', desc: '**Purpose:** Combine findings from multiple sources into a single narrative.\n\n**Output:** A unified research document resolving conflicting data.',
            children: [
              { name: 'Conflict Resolution Logic', desc: '**Purpose:** Identify and resolve contradictory facts from different sources.' },
              { name: 'Citation Generator', desc: '**Purpose:** Automatically append IEEE or APA formatted references.' }
            ]
          }
        ]
      },
      {
        name: 'File Studio',
        desc: '**Purpose:** Advanced file processing beyond simple text ingestion.\n\n**Output:** Extracted metadata, image descriptions, and structured tables.',
        children: [
          { 
            name: 'Media Parsing', desc: '**Purpose:** Extract content from images and videos using multimodal LLMs.\n\n**Output:** Textual descriptions of visual content.',
            children: [
              { name: 'Video Frame Sampler', desc: '**Purpose:** Extract 1 frame per second for timeline analysis.' },
              { name: 'Audio Transcriber', desc: '**Purpose:** Use Whisper to convert audio tracks to text.' }
            ]
          },
          { 
            name: 'Export Formatting', desc: '**Purpose:** Convert internal markdown into distributable formats.\n\n**Output:** Word documents, PDFs, and presentations.',
            children: [
              { name: 'PDF Generator', desc: '**Purpose:** Headless chromium printing for pixel-perfect PDFs.' },
              { name: 'Docx Builder', desc: '**Purpose:** Construct OpenXML objects for MS Word compatibility.' }
            ]
          }
        ]
      },
      {
        name: 'MCP Builder',
        desc: '**Purpose:** Create and manage Machine Control Protocol servers for agents.\n\n**Output:** Custom tools that agents can invoke (e.g., GitHub integration).',
        children: [
          { 
            name: 'Server Configuration', desc: '**Purpose:** Define connection parameters for new MCP servers.\n\n**Output:** Active WebSocket or SSE connections.',
            children: [
              { name: 'Auth Key Vault', desc: '**Purpose:** Securely store API keys for external servers.' },
              { name: 'Heartbeat Monitor', desc: '**Purpose:** Ping servers continuously to ensure active connection.' }
            ]
          },
          { 
            name: 'Tool Registry', desc: '**Purpose:** Map external API endpoints to agent-callable functions.\n\n**Output:** JSON schemas defining tool inputs and outputs.',
            children: [
              { name: 'Schema Validator', desc: '**Purpose:** Ensure agent payloads match the expected JSON schema.' },
              { name: 'Rate Limiter', desc: '**Purpose:** Prevent agents from spamming external APIs.' }
            ]
          }
        ]
      }
    ];

    const featureIdMap = new Map<string, number>();

    // Insert Taxonomy
    for (const major of taxonomy) {
       const majorInsert = await db.insert(businessFeatures).values({
          kbId: kbIdInt,
          name: major.name,
          description: major.desc,
          parentId: rootId,
          level: 'Feature',
          documentIds: [],
          isManualOverride: false
       }).returning({ id: businessFeatures.id });
       
       const majorId = majorInsert[0]!.id;
       featureIdMap.set(major.name, majorId);

       for (const child of major.children) {
          const childInsert = await db.insert(businessFeatures).values({
             kbId: kbIdInt,
             name: child.name,
             description: child.desc,
             parentId: majorId,
             level: 'Sub-Feature',
             documentIds: [],
             isManualOverride: false
          }).returning({ id: businessFeatures.id });
          
          const childId = childInsert[0]!.id;
          featureIdMap.set(child.name, childId);
          
          // Insert Level 3: Components
          if (child.children) {
             for (const comp of child.children) {
                const compInsert = await db.insert(businessFeatures).values({
                   kbId: kbIdInt,
                   name: comp.name,
                   description: comp.desc,
                   parentId: childId,
                   level: 'Component',
                   documentIds: [],
                   isManualOverride: false
                }).returning({ id: businessFeatures.id });
                const compId = compInsert[0]!.id;
                featureIdMap.set(comp.name, compId);

                // Insert Level 4: Class
                const classInsert = await db.insert(businessFeatures).values({
                   kbId: kbIdInt,
                   name: `${comp.name}Manager`,
                   description: `**Purpose:** Main orchestrator class for ${comp.name}.`,
                   parentId: compId,
                   level: 'Class',
                   documentIds: [],
                   isManualOverride: false
                }).returning({ id: businessFeatures.id });
                const classId = classInsert[0]!.id;

                // Insert Level 5: Function
                await db.insert(businessFeatures).values({
                   kbId: kbIdInt,
                   name: `execute${comp.name.replace(/\s+/g, '')}()`,
                   description: `**Purpose:** Primary entry point function for ${comp.name}.`,
                   parentId: classId,
                   level: 'Function',
                   documentIds: [],
                   isManualOverride: false
                });
             }
          }
       }
    }

    // Heuristically map actual documents to Sub-Features
    for (const doc of kbDocuments) {
       const title = doc.title.toLowerCase();
       let targetSubFeat = 'Document Ingestion'; // default

       if (title.includes('artifact')) targetSubFeat = 'Artifact Generation';
       else if (title.includes('preview')) targetSubFeat = 'Live Preview';
       else if (title.includes('edit')) targetSubFeat = 'Document Editing';
       else if (title.includes('chat') || title.includes('workspace')) targetSubFeat = 'Workspace Chat';
       else if (title.includes('graph') || title.includes('architecture')) targetSubFeat = 'Business Architecture Graph';
       else if (title.includes('search') || title.includes('vector')) targetSubFeat = 'Vector Search';
       else if (title.includes('web') || title.includes('browser')) targetSubFeat = 'Web Search Engine';
       else if (title.includes('synthesis') || title.includes('research')) targetSubFeat = 'Data Synthesis';
       else if (title.includes('image') || title.includes('video') || title.includes('media')) targetSubFeat = 'Media Parsing';
       else if (title.includes('export') || title.includes('format')) targetSubFeat = 'Export Formatting';
       else if (title.includes('mcp') || title.includes('server')) targetSubFeat = 'Server Configuration';
       else if (title.includes('tool') || title.includes('registry')) targetSubFeat = 'Tool Registry';

       const targetId = featureIdMap.get(targetSubFeat);
       if (targetId) {
          // fetch current docs and append
          const existing = await db.select({ documentIds: businessFeatures.documentIds }).from(businessFeatures).where(eq(businessFeatures.id, targetId));
          const currentDocs = (existing[0]?.documentIds as number[]) || [];
          currentDocs.push(doc.id);
          await db.update(businessFeatures).set({ documentIds: currentDocs }).where(eq(businessFeatures.id, targetId));
       }
    }

    // 4. Generate Flows
    const flows = [
      {
        name: 'Generate SOP',
        desc: '**Purpose:** Automate the creation of company guidelines based on uploaded context.\n\n**Output:** A downloadable PDF or Word document containing the final SOP.',
        steps: [
          { id: '1', stepName: 'User Prompt', description: '**Processing:** The system intercepts the user\'s natural language request (e.g., "Create an onboarding SOP").\n\n**Context Required:** Session ID and User Profile.\n\n**Technical Execution:** The prompt is sanitized and pushed to the `Workspace Chat` event queue.' },
          { id: '2', stepName: 'Workspace Chat', description: '**Processing:** The Orchestration Agent analyzes the intent of the prompt using a lightweight classification model to determine which tool to call.\n\n**Context Required:** Recent chat history.\n\n**Technical Execution:** Triggers the `Retrieval Tool` via an MCP protocol call.' },
          { id: '3', stepName: 'Knowledge Retrieval', description: '**Processing:** The system converts the prompt into an embedding vector and performs a cosine-similarity search against the PGVector database.\n\n**Context Required:** Embedding vector array.\n\n**Technical Execution:** Returns top-K document chunks containing historical company policies.' },
          { id: '4', stepName: 'LLM Synthesis', description: '**Processing:** A large context-window model (e.g., GPT-4o or Gemini 1.5 Pro) synthesizes the retrieved chunks into a standard operating procedure structure.\n\n**Context Required:** System prompt, user prompt, and retrieved context.\n\n**Technical Execution:** Streams a Markdown response back to the client via Server-Sent Events (SSE).' },
          { id: '5', stepName: 'Artifact Engine', description: '**Processing:** The system intercepts the Markdown stream, detects code blocks or structural elements, and converts them into a formalized React component state.\n\n**Context Required:** Raw Markdown stream.\n\n**Technical Execution:** Creates an entry in the `workspaceArtifacts` database table.' },
          { id: '6', stepName: 'Live Preview', description: '**Processing:** The frontend receives the artifact state and dynamically imports the necessary React components to render the document visually.\n\n**Context Required:** Artifact ID.\n\n**Technical Execution:** Updates the split-pane layout to mount the `<ArtifactRenderer />`.' },
          { id: '7', stepName: 'Export', description: '**Processing:** The system captures the rendered HTML of the artifact and pipes it through a headless browser or PDF generator.\n\n**Context Required:** Rendered DOM nodes.\n\n**Technical Execution:** Generates a `Blob` and triggers a browser download event.' }
        ]
      },
      {
        name: 'Ingest Codebase',
        desc: '**Purpose:** Allow the system to understand an entirely new software project.\n\n**Output:** A semantic graph and vector index representing the codebase.',
        steps: [
          { id: '1', stepName: 'User Upload', description: '**Processing:** The user provides a repository URL or uploads a `.zip` archive. The system validates the input size and format.\n\n**Context Required:** OAuth token (if private repo) or valid ZIP file.\n\n**Technical Execution:** Queues a background `SyncJob`.' },
          { id: '2', stepName: 'File Parser', description: '**Processing:** A recursive traversal function walks the directory tree. It reads `.gitignore` files to exclude unnecessary binaries (e.g., `node_modules`, `.git`).\n\n**Context Required:** Raw file buffer.\n\n**Technical Execution:** Creates rows in the `documents` table for each valid file.' },
          { id: '3', stepName: 'Chunking Engine', description: '**Processing:** Large code files are split into smaller semantic blocks based on functions, classes, or paragraph breaks.\n\n**Context Required:** Abstract Syntax Tree (AST) parsing.\n\n**Technical Execution:** Populates the `documentChunks` table with 500-token blocks.' },
          { id: '4', stepName: 'Embedding Model', description: '**Processing:** Each text chunk is sent to an embedding API (e.g., text-embedding-3-small) to generate a high-dimensional mathematical representation.\n\n**Context Required:** Text chunk string.\n\n**Technical Execution:** Updates the `embedding` vector column in the `documentChunks` table.' },
          { id: '5', stepName: 'Architecture Graph', description: '**Processing:** A heuristic engine or LLM analyzes the folder structures and file names to deduce higher-level business capabilities.\n\n**Context Required:** Entire repository file tree.\n\n**Technical Execution:** Populates the `businessFeatures` taxonomy table.' },
          { id: '6', stepName: 'Dashboard', description: '**Processing:** The frontend polls for job completion and redirects the user to the visual Knowledge Tree.\n\n**Context Required:** `SyncJob` completion status.\n\n**Technical Execution:** Hydrates the React Flow canvas with the new node data.' }
        ]
      },
      {
        name: 'Deploy MCP Server',
        desc: '**Purpose:** Extend the agent\'s capabilities with external tools.\n\n**Output:** A live WebSocket connection to a new set of tools (e.g. GitHub API).',
        steps: [
          { id: '1', stepName: 'User Config', description: '**Processing:** The user inputs a server URL, transport type (stdio, SSE, WebSocket), and any necessary API keys.\n\n**Context Required:** User authentication form.\n\n**Technical Execution:** Validates the URI format.' },
          { id: '2', stepName: 'Connection Handshake', description: '**Processing:** The GenWorkAI backend initiates a connection to the remote MCP server using the specified transport layer.\n\n**Context Required:** Remote server URI.\n\n**Technical Execution:** Exchanges protocol versioning to ensure compatibility.' },
          { id: '3', stepName: 'Schema Fetch', description: '**Processing:** The system sends a `tools/list` request to the MCP server to download all available functions.\n\n**Context Required:** Active socket connection.\n\n**Technical Execution:** Parses the returned JSON Schema defining tool inputs.' },
          { id: '4', stepName: 'Tool Registry', description: '**Processing:** The downloaded tools are registered in the local database and mapped to the active agent profile.\n\n**Context Required:** JSON Schema tools array.\n\n**Technical Execution:** Caches the tools in memory for rapid LLM access.' },
          { id: '5', stepName: 'Agent Execution', description: '**Processing:** When the user chats, the LLM decides to call the new tool. The system proxies the request through the active MCP connection.\n\n**Context Required:** Tool call arguments.\n\n**Technical Execution:** Transmits `call_tool` payload and awaits the JSON response.' }
        ]
      }
    ];

    for (const flow of flows) {
       await db.insert(businessFlows).values({
          kbId: kbIdInt,
          name: flow.name,
          description: flow.desc,
          steps: flow.steps,
          isManualOverride: false
       });
    }

    // Simulate LLM processing time
    await new Promise(resolve => setTimeout(resolve, 2000));

    return NextResponse.json({ success: true }, { headers: corsHeaders });

  } catch (error: any) {
    console.error('Upgrade Graph API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to extract business features' }, { status: 500, headers: corsHeaders });
  }
}
