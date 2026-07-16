import { pgTable, serial, text, timestamp, varchar, jsonb, integer, vector, boolean, uuid, bigint, numeric } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(), // Matches Supabase auth.users.id
  email: varchar('email', { length: 255 }).notNull().unique(),
  fullName: varchar('full_name', { length: 255 }),
  avatarUrl: text('avatar_url'),
  tier: varchar('tier', { length: 50 }).default('free'), // 'free' | 'pro'
  referralCode: varchar('referral_code', { length: 50 }).unique(),
  referredBy: varchar('referred_by', { length: 50 }),
  
  // Enterprise fields
  isAdmin: boolean('is_admin').default(false),
  isActive: boolean('is_active').default(true),
  userRole: varchar('user_role', { length: 50 }), // student, professional, freelancer, freebird, influencer
  socialUrl: text('social_url'),
  country: varchar('country', { length: 100 }),

  // Paddle Billing
  paddleCustomerId: varchar('paddle_customer_id', { length: 255 }),
  paddleSubscriptionId: varchar('paddle_subscription_id', { length: 255 }),
  paddleSubscriptionStatus: varchar('paddle_subscription_status', { length: 50 }), // 'active', 'canceled', 'past_due'

  createdAt: timestamp('created_at').defaultNow(),
});

export const systemConfig = pgTable('system_config', {
  key: varchar('key', { length: 255 }).primaryKey(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const tickets = pgTable('tickets', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'set null' }),
  
  type: varchar('type', { length: 50 }).notNull(), // 'demo', 'support', 'sales', 'partnership', 'bug', 'feature_request'
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }),
  company: varchar('company', { length: 255 }),
  
  subject: varchar('subject', { length: 255 }),
  message: text('message').notNull(),
  
  priority: varchar('priority', { length: 50 }).default('medium'), // 'low', 'medium', 'high', 'urgent'
  status: varchar('status', { length: 50 }).default('open'), // 'open', 'acknowledged', 'in_progress', 'resolved', 'closed'
  
  assignedTo: uuid('assigned_to').references(() => profiles.id, { onDelete: 'set null' }),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const ticketMessages = pgTable('ticket_messages', {
  id: serial('id').primaryKey(),
  ticketId: uuid('ticket_id').references(() => tickets.id, { onDelete: 'cascade' }).notNull(),
  senderId: uuid('sender_id').references(() => profiles.id, { onDelete: 'set null' }), // null for system, or an agent ID
  isAgent: boolean('is_agent').default(false).notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const earlyAccessRequests = pgTable('early_access_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  company: varchar('company', { length: 255 }),
  useCase: text('use_case'),
  status: varchar('status', { length: 50 }).default('pending'), // 'pending', 'invited'
  createdAt: timestamp('created_at').defaultNow(),
});

export const promotions = pgTable('promotions', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  description: text('description'),
  type: varchar('type', { length: 50 }).notNull(), // e.g. 'free_pro', 'extra_kb', 'discount'
  value: jsonb('value'), // e.g. { durationMonths: 1 } or { extraKbs: 5 }
  isActive: boolean('is_active').default(true),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const knowledgeBases = pgTable('knowledge_bases', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  color: varchar('color', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const documents = pgTable('documents', {
  id: serial('id').primaryKey(),
  kbId: integer('kb_id').references(() => knowledgeBases.id),
  sourceId: integer('source_id'),

  title: varchar('title', { length: 255 }).notNull(),
  sourceType: varchar('source_type', { length: 50 }).notNull(), // pdf, docx, url
  sourceUrl: text('source_url'), // Backwards compatibility for v1/v2 pipeline
  mimeType: varchar('mime_type', { length: 100 }),
  storageKey: text('storage_key'), // Key/Path in R2/S3/local
  storageProvider: varchar('storage_provider', { length: 50 }).default('local'), // 'local', 'r2', 's3'
  
  status: varchar('status', { length: 50 }).default('uploaded'), // 'uploaded', 'extracting', 'rendering', 'chunking', 'embedding', 'graph', 'completed', 'failed'
  intelligenceScore: numeric('intelligence_score', { precision: 5, scale: 2 }), // Score based on extraction quality, OCR, etc.
  
  // Versions for Incremental Reprocessing
  storageVersion: integer('storage_version').default(1),
  extractionVersion: integer('extraction_version').default(0),
  ocrVersion: integer('ocr_version').default(0),
  chunkingVersion: integer('chunking_version').default(0),
  embeddingVersion: integer('embedding_version').default(0),
  kgVersion: integer('kg_version').default(0),

  content: text('content'), // Raw extracted text
  knowledgeContent: text('knowledge_content'), // V1/V2 Enhanced text
  embeddingContent: text('embedding_content'), // V1/V2 Chunking text

  summary: text('summary'),
  classification: varchar('classification', { length: 100 }),
  topics: jsonb('topics'),
  keywords: jsonb('keywords'),
  metadata: jsonb('metadata'),
  sizeBytes: integer('size_bytes').default(0),
  checksum: varchar('checksum', { length: 255 }), // SHA256 of the file

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const documentPages = pgTable('document_pages', {
  id: serial('id').primaryKey(),
  documentId: integer('document_id').references(() => documents.id, { onDelete: 'cascade' }),
  pageNumber: integer('page_number').notNull(),
  
  imageStorageKey: text('image_storage_key'), // High-res rendered page
  thumbnailKey: text('thumbnail_key'),
  
  width: integer('width'),
  height: integer('height'),
  rotation: integer('rotation').default(0),
  
  hasVisualContent: boolean('has_visual_content').default(false), // True if charts, diagrams, etc. present
  ocrConfidence: numeric('ocr_confidence', { precision: 5, scale: 2 }),
  
  createdAt: timestamp('created_at').defaultNow(),
});

export const documentArtifacts = pgTable('document_artifacts', {
  id: serial('id').primaryKey(),
  documentId: integer('document_id').references(() => documents.id, { onDelete: 'cascade' }),
  pageNumber: integer('page_number'),
  
  type: varchar('type', { length: 50 }).notNull(), // 'figure', 'table', 'equation', 'ocr_region'
  identifier: varchar('identifier', { length: 100 }), // e.g., 'Fig 1', 'Table 2'
  
  content: text('content'), // Markdown, LaTeX, or structured text
  storageKey: text('storage_key'), // S3 key if it's a cropped image of the artifact
  
  boundingBox: jsonb('bounding_box'), // [x, y, width, height]
  confidenceScore: numeric('confidence_score', { precision: 5, scale: 2 }),
  
  createdAt: timestamp('created_at').defaultNow(),
});

export const documentProcessingLogs = pgTable('document_processing_logs', {
  id: serial('id').primaryKey(),
  documentId: integer('document_id').references(() => documents.id, { onDelete: 'cascade' }),
  stage: varchar('stage', { length: 50 }).notNull(), // 'extraction', 'chunking', 'embedding'
  status: varchar('status', { length: 50 }).notNull(), // 'started', 'success', 'failed'
  message: text('message'),
  durationMs: integer('duration_ms'),
  metrics: jsonb('metrics'), // { tokens, cost, pages, artifacts_found }
  createdAt: timestamp('created_at').defaultNow(),
});

export const documentChunks = pgTable('document_chunks', {
  id: serial('id').primaryKey(),
  documentId: integer('document_id').references(() => documents.id, { onDelete: 'cascade' }),
  parentId: integer('parent_id'), // Hierarchical linking
  
  level: integer('level').default(3), // 0: Doc, 1: Section, 2: Question, 3: Paragraph, etc.
  chunkType: varchar('chunk_type', { length: 50 }), // 'text', 'header', 'list', 'code'
  
  content: text('content').notNull(),
  pageNumber: integer('page_number'),
  readingOrder: integer('reading_order'),
  
  boundingBox: jsonb('bounding_box'), // [x, y, w, h]
  
  artifactRefs: jsonb('artifact_refs'), // Array of artifact IDs linked to this chunk
  assets: jsonb('assets'), // Dictionary of UUID to Base64 strings for autonomous images
  
  hash: varchar('hash', { length: 64 }), // sha256 chunk hash for deduplication
  createdAt: timestamp('created_at').defaultNow(),
});

export const documentEmbeddings = pgTable('document_embeddings', {
  id: serial('id').primaryKey(),
  documentId: integer('document_id').references(() => documents.id, { onDelete: 'cascade' }),
  chunkId: integer('chunk_id').references(() => documentChunks.id, { onDelete: 'cascade' }),
  artifactId: integer('artifact_id').references(() => documentArtifacts.id, { onDelete: 'cascade' }),
  
  model: varchar('model', { length: 100 }).notNull().default('bge-m3'),
  vector: vector('vector', { dimensions: 1024 }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const documentQuestions = pgTable('document_questions', {
  id: serial('id').primaryKey(),
  documentId: integer('document_id').references(() => documents.id, { onDelete: 'cascade' }),
  identifier: varchar('identifier', { length: 100 }).notNull(), // 'Q1', 'Question 4'
  
  pageNumber: integer('page_number'),
  boundingBox: jsonb('bounding_box'),
  
  content: text('content'),
  options: jsonb('options'), // If multiple choice
  
  artifactRefs: jsonb('artifact_refs'), // Associated diagrams or tables
  createdAt: timestamp('created_at').defaultNow(),
});

export const knowledgeNodes = pgTable('knowledge_nodes', {
  id: serial('id').primaryKey(),
  kbId: integer('kb_id').references(() => knowledgeBases.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }), // 'Concept', 'Entity', 'Topic'
  description: text('description'),
  metadata: jsonb('metadata'), // e.g., associated document IDs
  createdAt: timestamp('created_at').defaultNow(),
});

export const knowledgeEdges = pgTable('knowledge_edges', {
  id: serial('id').primaryKey(),
  sourceNodeId: integer('source_node_id').references(() => knowledgeNodes.id, { onDelete: 'cascade' }),
  targetNodeId: integer('target_node_id').references(() => knowledgeNodes.id, { onDelete: 'cascade' }),
  relationshipType: varchar('relationship_type', { length: 100 }), // 'relates_to', 'part_of', 'depends_on'
  weight: numeric('weight', { precision: 5, scale: 2 }).default('1.0'),
  documentRefs: jsonb('document_refs'), // Documents where this edge is found
  createdAt: timestamp('created_at').defaultNow(),
});

export const semanticCache = pgTable('semantic_cache', {
  id: serial('id').primaryKey(),
  kbId: integer('kb_id').references(() => knowledgeBases.id, { onDelete: 'cascade' }),
  queryHash: varchar('query_hash', { length: 64 }).notNull().unique(),
  queryText: text('query_text').notNull(),
  response: jsonb('response').notNull(), // The complete structured response
  hitCount: integer('hit_count').default(1),
  createdAt: timestamp('created_at').defaultNow(),
  lastHitAt: timestamp('last_hit_at').defaultNow(),
});

export const workspaceChats = pgTable('workspace_chats', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  kbId: integer('kb_id').references(() => knowledgeBases.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const workspaceMessages = pgTable('workspace_messages', {
  id: serial('id').primaryKey(),
  chatId: integer('chat_id').references(() => workspaceChats.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 50 }).notNull(), // 'user' | 'assistant'
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const knowledgeSources = pgTable('knowledge_sources', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }),
  kbId: integer('kb_id').references(() => knowledgeBases.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // github, database, website, folder, file
  configuration: jsonb('configuration'), // credentials, urls, etc.
  classification: jsonb('classification'), // category, type, language
  
  // Health Tracking
  lastSyncAt: timestamp('last_sync_at'),
  lastSuccessfulSyncAt: timestamp('last_successful_sync_at'),
  syncStatus: varchar('sync_status', { length: 50 }).default('pending'), // pending, processing, partially_completed, success, failed, cancelled
  documentCount: integer('document_count').default(0),
  chunkCount: integer('chunk_count').default(0),

  // Processing Stats
  filesProcessed: integer('files_processed').default(0),
  chunksGenerated: integer('chunks_generated').default(0),
  embeddingsGenerated: integer('embeddings_generated').default(0),
  errorsCount: integer('errors_count').default(0),
  progress: jsonb('progress'), // Detailed progress object

  // Optimization
  latestHash: varchar('latest_hash', { length: 255 }), // commit hash, schema hash
  lastSuccessfulHash: varchar('last_successful_hash', { length: 255 }), 

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const githubInstallations = pgTable('github_installations', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  installationId: integer('installation_id').notNull().unique(),
  accountName: varchar('account_name', { length: 255 }), // e.g. the organization or user name on GitHub
  createdAt: timestamp('created_at').defaultNow(),
});

export const sourceSnapshots = pgTable('source_snapshots', {
  id: serial('id').primaryKey(),
  sourceId: integer('source_id').references(() => knowledgeSources.id, { onDelete: 'cascade' }),
  hash: varchar('hash', { length: 255 }).notNull(), // commit hash, schema hash
  metadata: jsonb('metadata'), // what changed
  createdAt: timestamp('created_at').defaultNow(),
});

export const syncJobs = pgTable('sync_jobs', {
  id: serial('id').primaryKey(),
  sourceId: integer('source_id').references(() => knowledgeSources.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 50 }).default('queued'), // queued, processing, partially_completed, completed, failed, cancelled
  progress: jsonb('progress'), // { stage, current_step, total_documents, ... }
  error: text('error'),
  startedAt: timestamp('started_at'),
  finishedAt: timestamp('finished_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const workspaceArtifacts = pgTable('workspace_artifacts', {
  id: serial('id').primaryKey(),
  chatId: integer('chat_id').references(() => workspaceChats.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  fileType: varchar('file_type', { length: 50 }).notNull(),
  category: varchar('category', { length: 100 }),
  status: varchar('status', { length: 50 }).default('draft'),
  isPinned: boolean('is_pinned').default(false),
  relationships: jsonb('relationships'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const workspaceArtifactVersions = pgTable('workspace_artifact_versions', {
  id: serial('id').primaryKey(),
  artifactId: integer('artifact_id').references(() => workspaceArtifacts.id, { onDelete: 'cascade' }),
  versionNumber: integer('version_number').notNull(),
  content: text('content').notNull(),
  sourceDocIds: jsonb('source_doc_ids'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const businessFeatures = pgTable('business_features', {
  id: serial('id').primaryKey(),
  kbId: integer('kb_id').references(() => knowledgeBases.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  parentId: integer('parent_id'), // hierarchical linking
  level: varchar('level', { length: 50 }), // 'Product' | 'Feature' | 'Sub-Feature'
  documentIds: jsonb('document_ids'), // Associated implementation files (array of numbers)
  isManualOverride: boolean('is_manual_override').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const businessFlows = pgTable('business_flows', {
  id: serial('id').primaryKey(),
  kbId: integer('kb_id').references(() => knowledgeBases.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  steps: jsonb('steps'), // Array of { id, stepName, description, featureId, documentIds }
  isManualOverride: boolean('is_manual_override').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const mcpServers = pgTable('mcp_servers', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  kbIds: jsonb('kb_ids'), // Array of Knowledge Base IDs bound to this server
  enabledCapabilities: jsonb('enabled_capabilities'), // e.g. ["sources", "knowledge", "generation", "workspace"]
  status: varchar('status', { length: 50 }).default('active'), // 'active' | 'disabled'
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const mcpApiKeys = pgTable('mcp_api_keys', {
  id: serial('id').primaryKey(),
  serverId: integer('server_id').references(() => mcpServers.id, { onDelete: 'cascade' }),
  keyHash: varchar('key_hash', { length: 255 }).notNull(),
  keyPrefix: varchar('key_prefix', { length: 50 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  status: varchar('status', { length: 50 }).default('active'),
  createdAt: timestamp('created_at').defaultNow(),
  lastUsedAt: timestamp('last_used_at'),
});

export const apiKeys = pgTable('api_keys', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }),
  keyHash: varchar('key_hash', { length: 255 }).notNull(), // The hashed key string
  keyPrefix: varchar('key_prefix', { length: 50 }).notNull(), // e.g., 'gk_live_abc123'
  name: varchar('name', { length: 255 }).notNull(),
  scopes: jsonb('scopes').default([]), // ['kb:read', 'kb:write', 'db:query', 'mcp:execute']
  resourceScopes: jsonb('resource_scopes'), // e.g., {"kb": [12,18], "db": [4]}
  status: varchar('status', { length: 50 }).default('active'), // 'active', 'revoked'
  createdAt: timestamp('created_at').defaultNow(),
  expiresAt: timestamp('expires_at'),
  lastUsedAt: timestamp('last_used_at'),
});

export const apiUsageLogs = pgTable('api_usage_logs', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }),
  apiKeyId: integer('api_key_id').references(() => apiKeys.id, { onDelete: 'set null' }),
  endpoint: varchar('endpoint', { length: 255 }).notNull(),
  resourceType: varchar('resource_type', { length: 50 }), // 'kb', 'db', 'mcp'
  resourceId: integer('resource_id'),
  status: integer('status').default(200), // HTTP status code
  durationMs: integer('duration_ms'),
  metrics: jsonb('metrics'), // { requests, llm_tokens, embedding_tokens, vector_searches, db_queries, artifacts_generated, automation_executions }
  createdAt: timestamp('created_at').defaultNow(),
});

export const connectedDatabases = pgTable('connected_databases', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }),
  kbId: integer('kb_id').references(() => knowledgeBases.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  engine: varchar('engine', { length: 50 }).notNull(), // 'pg', 'mysql', 'mssql', 'mongodb'
  connectionString: text('connection_string'), // Encrypted connection string
  host: varchar('host', { length: 255 }),
  port: integer('port'),
  databaseName: varchar('database_name', { length: 255 }),
  username: varchar('username', { length: 255 }),
  password: text('password'), // Encrypted password
  accessMode: varchar('access_mode', { length: 50 }).default('read_only'), // 'read_only' | 'advanced'
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const databaseSchemas = pgTable('database_schemas', {
  id: serial('id').primaryKey(),
  databaseId: integer('database_id').references(() => connectedDatabases.id, { onDelete: 'cascade' }),
  schemaData: jsonb('schema_data').notNull(), // The extracted schema JSON (tables, columns, types)
  extractedAt: timestamp('extracted_at').defaultNow(),
});

export const automationTasks = pgTable('automation_tasks', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }).notNull(), // 'knowledge', 'documentation', 'developer', 'database', 'monitoring', 'workspace', 'ai_agent'
  templateId: varchar('template_id', { length: 100 }), // e.g., 'knowledge_digest'
  sources: jsonb('sources'), // Array of { type: string, id: number | string }
  artifactTypes: jsonb('artifact_types'), // Array of strings e.g. ['document', 'report']
  executionMode: varchar('execution_mode', { length: 50 }).notNull().default('manual'), // 'manual', 'scheduled', 'triggered'
  schedule: varchar('schedule', { length: 100 }), // e.g. 'daily', 'weekly', cron expression
  triggerEvent: varchar('trigger_event', { length: 100 }), // e.g., 'on_kb_update'
  goal: text('goal'), // The actual prompt/goal instructions
  sqlQuery: text('sql_query'), // Stored SQL query if database automation
  status: varchar('status', { length: 50 }).default('active'), // 'draft', 'active', 'paused', 'running', 'completed', 'failed', 'archived'
  lastRunAt: timestamp('last_run_at'),
  nextRunAt: timestamp('next_run_at'),
  successRate: integer('success_rate').default(100),
  averageRuntimeMs: integer('average_runtime_ms').default(0),
  creditsConsumedThisMonth: integer('credits_consumed_this_month').default(0),
  totalRuns: integer('total_runs').default(0),
  lastFailureAt: timestamp('last_failure_at'),
  aiProvider: varchar('ai_provider', { length: 50 }),
  billingMode: varchar('billing_mode', { length: 50 }).default('platform'), // 'platform', 'byok'
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const automationVersions = pgTable('automation_versions', {
  id: serial('id').primaryKey(),
  taskId: integer('task_id').references(() => automationTasks.id, { onDelete: 'cascade' }),
  versionNumber: integer('version_number').notNull(),
  configSnapshot: jsonb('config_snapshot').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  createdBy: uuid('created_by').references(() => profiles.id, { onDelete: 'set null' }),
});

export const automationLogs = pgTable('automation_logs', {
  id: serial('id').primaryKey(),
  taskId: integer('task_id').references(() => automationTasks.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 50 }).notNull(), // 'success', 'failed', 'running'
  logs: text('logs'),
  artifactId: integer('artifact_id').references(() => workspaceArtifacts.id, { onDelete: 'set null' }), // Link to generated artifact
  sourceSnapshot: jsonb('source_snapshot'), // Track exact state of the source at execution
  startedAt: timestamp('started_at').defaultNow(),
  finishedAt: timestamp('finished_at'),
  durationMs: integer('duration_ms'),
  creditsConsumed: integer('credits_consumed').default(0),
  provider: varchar('provider', { length: 50 }),
  model: varchar('model', { length: 100 }),
  inputTokens: integer('input_tokens').default(0),
  outputTokens: integer('output_tokens').default(0),
  sqlExecuted: text('sql_executed'),
  notificationsSent: integer('notifications_sent').default(0),
  errorDetails: text('error_details'),
  retryCount: integer('retry_count').default(0),
});

export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'set null' }),
  action: varchar('action', { length: 100 }).notNull(),
  resourceType: varchar('resource_type', { length: 50 }),
  resourceId: integer('resource_id'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const apiUsageCounters = pgTable('api_usage_counters', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  period: varchar('period', { length: 7 }).notNull(), // format 'YYYY-MM'
  
  requests: integer('requests').default(0).notNull(),
  llmTokens: integer('llm_tokens').default(0).notNull(),
  dbQueries: integer('db_queries').default(0).notNull(),
  vectorSearches: integer('vector_searches').default(0).notNull(),
  generatedArtifacts: integer('generated_artifacts').default(0).notNull(),
  
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const databaseQueryLogs = pgTable('database_query_logs', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  databaseId: integer('database_id').references(() => connectedDatabases.id, { onDelete: 'cascade' }).notNull(),
  question: text('question'),
  generatedSql: text('generated_sql'),
  executionTimeMs: integer('execution_time_ms'),
  rowCount: integer('row_count'),
  success: boolean('success').default(true),
  error: text('error'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const userLlmKeys = pgTable('user_llm_keys', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  provider: varchar('provider', { length: 50 }).notNull(), // 'openai', 'anthropic', 'gemini', 'openrouter', 'ollama', etc.
  apiKey: text('api_key').notNull(), // Encrypted
  baseUrl: text('base_url'), // For local models or custom endpoints
  defaultModel: varchar('default_model', { length: 100 }), // The default model to use when routing to this provider
  
  scope: varchar('scope', { length: 50 }).default('personal'), // 'personal', 'workspace', 'organization'
  status: varchar('status', { length: 50 }).default('active'), // 'active', 'invalid', 'testing'
  lastValidatedAt: timestamp('last_validated_at'),
  lastError: text('last_error'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const aiProfiles = pgTable('ai_profiles', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull().unique(),
  
  workspaceModelId: integer('workspace_model_id').references(() => userLlmKeys.id, { onDelete: 'set null' }),
  knowledgeModelId: integer('knowledge_model_id').references(() => userLlmKeys.id, { onDelete: 'set null' }),
  databaseModelId: integer('database_model_id').references(() => userLlmKeys.id, { onDelete: 'set null' }),
  automationModelId: integer('automation_model_id').references(() => userLlmKeys.id, { onDelete: 'set null' }),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const subscriptionPlans = pgTable('subscription_plans', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  description: text('description'),
  monthlyPrice: integer('monthly_price').default(0), // stored in cents
  yearlyPrice: integer('yearly_price').default(0),
  isActive: boolean('is_active').default(true),

  // Paddle Price IDs
  paddleProductId: varchar('paddle_product_id', { length: 255 }),
  paddleMonthlyPriceId: varchar('paddle_monthly_price_id', { length: 255 }),
  paddleYearlyPriceId: varchar('paddle_yearly_price_id', { length: 255 }),

  // Limits
  knowledgeBaseLimit: integer('knowledge_base_limit').default(0),
  databaseLimit: integer('database_limit').default(0),
  workspaceLimit: integer('workspace_limit').default(0),
  automationLimit: integer('automation_limit').default(0),
  apiKeyLimit: integer('api_key_limit').default(0),
  apiRequestLimit: integer('api_request_limit').default(0),
  contextLimit: bigint('context_limit', { mode: 'number' }).default(0), // in bytes
  mcpServerLimit: integer('mcp_server_limit').default(0),
  mcpToolLimit: integer('mcp_tool_limit').default(0),
  mcpRequestLimit: integer('mcp_request_limit').default(0),
  concurrencyLimit: integer('concurrency_limit').default(5),
  rateLimit: integer('rate_limit').default(60),
  monthlyAiCredits: integer('monthly_ai_credits').default(0),
  endpointLimit: integer('endpoint_limit').default(0),

  // Features
  knowledgeBaseEnabled: boolean('knowledge_base_enabled').default(false),
  databaseIntelligenceEnabled: boolean('database_intelligence_enabled').default(false),
  automationStudioEnabled: boolean('automation_studio_enabled').default(false),
  apiAccessEnabled: boolean('api_access_enabled').default(false),
  mcpEnabled: boolean('mcp_enabled').default(false),
  byokEnabled: boolean('byok_enabled').default(false),
  prioritySupportEnabled: boolean('priority_support_enabled').default(false),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const baseparsePricingPlans = pgTable('baseparse_pricing_plans', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  priceCents: integer('price_cents').notNull(),
  pageExtractionLimit: integer('page_extraction_limit').notNull(),
  paddleProductId: varchar('paddle_product_id', { length: 255 }),
  paddlePriceId: varchar('paddle_price_id', { length: 255 }),
  isActive: boolean('is_active').default(true),
  displayOrder: integer('display_order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const baseparseUserPlans = pgTable('baseparse_user_plans', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  planId: integer('plan_id').references(() => baseparsePricingPlans.id, { onDelete: 'cascade' }),
  pagesExtractedThisMonth: integer('pages_extracted_this_month').default(0),
  paddleSubscriptionId: varchar('paddle_subscription_id', { length: 255 }),
  status: varchar('status', { length: 50 }).default('active'),
  currentPeriodStart: timestamp('current_period_start'),
  currentPeriodEnd: timestamp('current_period_end'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const baseparseApiKeys = pgTable('baseparse_api_keys', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  keyHash: varchar('key_hash', { length: 255 }).notNull(),
  keyPrefix: varchar('key_prefix', { length: 50 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  status: varchar('status', { length: 50 }).default('active'),
  createdAt: timestamp('created_at').defaultNow(),
  lastUsedAt: timestamp('last_used_at'),
});

export const baseparseDocuments = pgTable('baseparse_documents', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  status: varchar('status', { length: 50 }).default('processing'), // processing, completed, failed
  pageCount: integer('page_count').default(0),
  extractedData: jsonb('extracted_data'), // JSON payload
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const promotionTemplates = pgTable('promotion_templates', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  description: text('description'),
  type: varchar('type', { length: 50 }).notNull(), // 'discount', 'free_months', 'feature_unlock'
  value: jsonb('value'), // e.g. { months: 1 } or { discountPercent: 20 }
  duration: integer('duration'), // duration in months, null for lifetime
  paddleDiscountId: varchar('paddle_discount_id', { length: 255 }), // Paddle Discount ID
  isActive: boolean('is_active').default(true),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const adminAuditLogs = pgTable('admin_audit_logs', {
  id: serial('id').primaryKey(),
  adminId: uuid('admin_id').references(() => profiles.id, { onDelete: 'set null' }),
  action: varchar('action', { length: 255 }).notNull(),
  entityType: varchar('entity_type', { length: 100 }), // 'user', 'plan', 'promotion', etc.
  entityId: varchar('entity_id', { length: 255 }),
  previousValue: jsonb('previous_value'),
  newValue: jsonb('new_value'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const featureFlags = pgTable('feature_flags', {
  id: serial('id').primaryKey(),
  key: varchar('key', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  isEnabled: boolean('is_enabled').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const userSubscriptions = pgTable('user_subscriptions', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  planId: integer('plan_id').references(() => subscriptionPlans.id, { onDelete: 'restrict' }),
  status: varchar('status', { length: 50 }).notNull(), // 'trialing', 'active', 'past_due', 'grace_period', 'cancelled', 'expired'
  billingCycle: varchar('billing_cycle', { length: 50 }), // 'monthly', 'yearly'
  paddleCustomerId: varchar('paddle_customer_id', { length: 255 }),
  paddleSubscriptionId: varchar('paddle_subscription_id', { length: 255 }),
  startedAt: timestamp('started_at'),
  renewsAt: timestamp('renews_at'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const billingEvents = pgTable('billing_events', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  amount: integer('amount').notNull(), // Stored in cents
  currency: varchar('currency', { length: 10 }).notNull().default('USD'),
  eventType: varchar('event_type', { length: 100 }).notNull(), // 'payment_success', 'payment_failed', 'subscription_created', etc.
  paddleTransactionId: varchar('paddle_transaction_id', { length: 255 }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const usageCounters = pgTable('usage_counters', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  month: varchar('month', { length: 7 }).notNull(), // format 'YYYY-MM'
  apiRequests: integer('api_requests').default(0).notNull(),
  kbCount: integer('kb_count').default(0).notNull(),
  databaseCount: integer('database_count').default(0).notNull(),
  automationCount: integer('automation_count').default(0).notNull(),
  mcpCount: integer('mcp_count').default(0).notNull(),
  contextUsed: bigint('context_used', { mode: 'number' }).default(0).notNull(), // in bytes
  artifactsGenerated: integer('artifacts_generated').default(0).notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const aiUsageLogs = pgTable('ai_usage_logs', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  workspaceId: integer('workspace_id'), // Nullable for future compatibility
  model: varchar('model', { length: 100 }).notNull(),
  promptTokens: integer('prompt_tokens').notNull().default(0),
  completionTokens: integer('completion_tokens').notNull().default(0),
  totalTokens: integer('total_tokens').notNull().default(0),
  estimatedCost: varchar('estimated_cost', { length: 50 }).notNull().default('0'), // Store as string to prevent floating point loss
  taskCategory: varchar('task_category', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const userAiCreditBalance = pgTable('user_ai_credit_balance', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull().unique(),
  monthlyRemainingCredits: integer('monthly_remaining_credits').default(0),
  purchasedRemainingCredits: integer('purchased_remaining_credits').default(0),
  monthlyResetAt: timestamp('monthly_reset_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const aiCreditPackProducts = pgTable('ai_credit_pack_products', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  credits: integer('credits').notNull(),
  priceCents: integer('price_cents').notNull(),
  paddleProductId: varchar('paddle_product_id', { length: 255 }),
  paddlePriceId: varchar('paddle_price_id', { length: 255 }),
  displayOrder: integer('display_order').default(0),
  badge: varchar('badge', { length: 50 }),
  isFeatured: boolean('is_featured').default(false),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const userAiCreditPurchases = pgTable('user_ai_credit_purchases', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  purchasedCredits: integer('purchased_credits').notNull(),
  remainingCredits: integer('remaining_credits').notNull(),
  paddleTransactionId: varchar('paddle_transaction_id', { length: 255 }),
  status: varchar('status', { length: 50 }).default('active'), // 'active', 'exhausted'
  purchasedAt: timestamp('purchased_at').defaultNow(),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const aiCreditCosts = pgTable('ai_credit_costs', {
  id: serial('id').primaryKey(),
  operationKey: varchar('operation_key', { length: 100 }).notNull().unique(),
  displayName: varchar('display_name', { length: 100 }).notNull(),
  credits: integer('credits').notNull(),
  category: varchar('category', { length: 50 }),
  description: text('description'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const aiUsageHistory = pgTable('ai_usage_history', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  workspaceId: integer('workspace_id'), // Nullable for general actions
  operationKey: varchar('operation_key', { length: 100 }).notNull(),
  creditsUsed: integer('credits_used').notNull(),
  status: varchar('status', { length: 50 }).default('success'), // 'success', 'failed'
  durationMs: integer('duration_ms'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const aiUsage = pgTable('ai_usage', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').references(() => profiles.id).notNull(),
  workspaceId: integer('workspace_id'),
  operation: varchar('operation', { length: 100 }).notNull(),
  featureCategory: varchar('feature_category', { length: 100 }), // The specific feature category
  endpoint: varchar('endpoint', { length: 255 }),
  artifactType: varchar('artifact_type', { length: 100 }),
  
  billingMode: varchar('billing_mode', { length: 50 }).notNull().default('platform'), // platform, byok, developer_api
  isByok: boolean('is_byok').default(false),
  
  requestId: varchar('request_id', { length: 255 }),
  correlationId: varchar('correlation_id', { length: 255 }),
  
  provider: varchar('provider', { length: 50 }),
  model: varchar('model', { length: 100 }),
  
  inputTokens: integer('input_tokens').default(0),
  outputTokens: integer('output_tokens').default(0),
  embeddingTokens: integer('embedding_tokens').default(0),
  rerankerTokens: integer('reranker_tokens').default(0),
  
  estimatedCredits: integer('estimated_credits').default(0),
  reservedCredits: integer('reserved_credits').default(0),
  actualCredits: integer('actual_credits').default(0),
  
  providerCost: numeric('provider_cost', { precision: 10, scale: 6 }), // exact USD cost
  
  status: varchar('status', { length: 50 }).default('completed'), // 'completed', 'failed'
  reservationStatus: varchar('reservation_status', { length: 50 }), // 'reserved', 'finalized', 'refunded'
  failureReason: text('failure_reason'),
  
  durationMs: integer('duration_ms'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const aiCreditLedger = pgTable('ai_credit_ledger', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  amount: integer('amount').notNull(), // Positive for additions, negative for consumption
  type: varchar('type', { length: 50 }).notNull(), // 'refill', 'purchase', 'grant', 'consume', 'refund'
  operationKey: varchar('operation_key', { length: 100 }), // Context if it was a consumption
  idempotencyKey: varchar('idempotency_key', { length: 255 }).unique(), // Prevent duplicates
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const quizzes = pgTable('quizzes', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  kbId: integer('kb_id').references(() => knowledgeBases.id, { onDelete: 'set null' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  
  // Rules and Config
  rules: jsonb('rules'), // { timePerQuestion, totalTime, randomizeQuestions, randomizeOptions, passingPercentage, attemptsAllowed, showAnswersAfter, showScoreImmediately, antiCheating: { fullscreen, tabSwitch } }
  scope: jsonb('scope'), // { type: 'entire_kb'|'folder'|'files'|'topic', value: string|string[] }
  
  // Shareable Exam
  shareableLink: varchar('shareable_link', { length: 255 }).unique(),
  timingMode: varchar('timing_mode', { length: 50 }).default('self_paced'), // 'global', 'self_paced'
  startTime: timestamp('start_time'),
  endTime: timestamp('end_time'),
  
  status: varchar('status', { length: 50 }).default('draft'), // 'draft', 'published', 'archived'
  estimatedCredits: integer('estimated_credits').default(0),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const quizQuestions = pgTable('quiz_questions', {
  id: serial('id').primaryKey(),
  quizId: integer('quiz_id').references(() => quizzes.id, { onDelete: 'cascade' }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'multiple_choice', 'true_false', 'short_answer', 'theory'
  difficulty: varchar('difficulty', { length: 50 }),
  bloomLevel: varchar('bloom_level', { length: 50 }),
  
  questionText: text('question_text').notNull(),
  options: jsonb('options'), // array of strings for multiple choice
  correctAnswer: text('correct_answer'),
  explanation: text('explanation'),
  
  // Traceability
  referenceFile: varchar('reference_file', { length: 255 }),
  referenceSection: text('reference_section'),
  
  orderIndex: integer('order_index').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

export const quizAttempts = pgTable('quiz_attempts', {
  id: serial('id').primaryKey(),
  quizId: integer('quiz_id').references(() => quizzes.id, { onDelete: 'cascade' }).notNull(),
  
  // User can be authenticated or a guest
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }),
  guestName: varchar('guest_name', { length: 255 }),
  guestRollNumber: varchar('guest_roll_number', { length: 255 }),
  
  status: varchar('status', { length: 50 }).default('in_progress'), // 'in_progress', 'submitted', 'graded'
  score: numeric('score', { precision: 5, scale: 2 }).default('0'),
  totalMarks: numeric('total_marks', { precision: 5, scale: 2 }).default('0'),
  
  warningsCount: integer('warnings_count').default(0),
  antiCheatingLogs: jsonb('anti_cheating_logs'), // array of { time, event }
  
  startedAt: timestamp('started_at').defaultNow(),
  finishedAt: timestamp('finished_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const quizAttemptAnswers = pgTable('quiz_attempt_answers', {
  id: serial('id').primaryKey(),
  attemptId: integer('attempt_id').references(() => quizAttempts.id, { onDelete: 'cascade' }).notNull(),
  questionId: integer('question_id').references(() => quizQuestions.id, { onDelete: 'cascade' }).notNull(),
  
  userAnswer: text('user_answer'),
  status: varchar('status', { length: 50 }).default('not_visited'), // 'not_visited', 'visited', 'answered', 'doubt', 'cant_answer'
  
  isCorrect: boolean('is_correct'),
  marksAwarded: numeric('marks_awarded', { precision: 5, scale: 2 }),
  aiFeedback: text('ai_feedback'), // used for theory questions
  aiGradedAt: timestamp('ai_graded_at'),
  
  timeSpentMs: integer('time_spent_ms').default(0),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const questionBank = pgTable('question_bank', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  kbId: integer('kb_id').references(() => knowledgeBases.id, { onDelete: 'set null' }),
  
  type: varchar('type', { length: 50 }).notNull(),
  difficulty: varchar('difficulty', { length: 50 }),
  bloomLevel: varchar('bloom_level', { length: 50 }),
  topics: jsonb('topics'),
  
  questionText: text('question_text').notNull(),
  options: jsonb('options'),
  correctAnswer: text('correct_answer'),
  explanation: text('explanation'),
  
  referenceFile: varchar('reference_file', { length: 255 }),
  referenceSection: text('reference_section'),
  
  createdAt: timestamp('created_at').defaultNow(),
});

export const automationOutputs = pgTable('automation_outputs', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  kbId: integer('kb_id').references(() => knowledgeBases.id, { onDelete: 'set null' }),
  
  module: varchar('module', { length: 100 }).notNull(), // 'study_center', 'lesson_planner', etc.
  template: varchar('template', { length: 100 }).notNull(), // 'flashcards', 'summary', etc.
  
  title: varchar('title', { length: 255 }).notNull(),
  status: varchar('status', { length: 50 }).default('draft'), // 'draft', 'generating', 'completed', 'failed'
  
  creditsUsed: integer('credits_used').default(0),
  provider: varchar('provider', { length: 50 }),
  billingMode: varchar('billing_mode', { length: 50 }), // 'platform', 'byok'
  durationMs: integer('duration_ms'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const automationOutputVersions = pgTable('automation_output_versions', {
  id: serial('id').primaryKey(),
  outputId: integer('output_id').references(() => automationOutputs.id, { onDelete: 'cascade' }).notNull(),
  
  versionNumber: integer('version_number').notNull(),
  content: text('content').notNull(),
  format: varchar('format', { length: 50 }).notNull().default('markdown'), // 'markdown', 'json', 'pdf', 'csv'
  
  createdAt: timestamp('created_at').defaultNow(),
});

export const dashboards = pgTable('dashboards', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  dataSourceId: integer('data_source_id').references(() => connectedDatabases.id, { onDelete: 'cascade' }), // Generic abstraction
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  icon: varchar('icon', { length: 50 }),
  coverColor: varchar('cover_color', { length: 50 }),
  isAiGenerated: boolean('is_ai_generated').default(false),
  isTemplate: boolean('is_template').default(false),
  globalFiltersConfig: jsonb('global_filters_config'), // e.g. { dateRange: 'last_30_days', region: 'NA' }
  isFavorite: boolean('is_favorite').default(false),
  isArchived: boolean('is_archived').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const dashboardVersions = pgTable('dashboard_versions', {
  id: serial('id').primaryKey(),
  dashboardId: integer('dashboard_id').references(() => dashboards.id, { onDelete: 'cascade' }).notNull(),
  versionNumber: integer('version_number').notNull(),
  layoutSnapshot: jsonb('layout_snapshot').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  createdBy: uuid('created_by').references(() => profiles.id, { onDelete: 'set null' }),
});

export const dashboardWidgets = pgTable('dashboard_widgets', {
  id: serial('id').primaryKey(),
  dashboardId: integer('dashboard_id').references(() => dashboards.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  widgetType: varchar('widget_type', { length: 50 }).notNull(), // 'line', 'bar', 'table', 'kpi', etc.
  sqlQuery: text('sql_query'),
  refreshInterval: varchar('refresh_interval', { length: 50 }).default('manual'), // '1m', '1h', etc.
  visualizationConfig: jsonb('visualization_config'),
  layoutConfig: jsonb('layout_config'), // x, y, w, h for react-grid-layout
  lastRefreshedAt: timestamp('last_refreshed_at'),
  lastExecutionTime: integer('last_execution_time'), // in ms
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const dashboardWidgetCache = pgTable('dashboard_widget_cache', {
  widgetId: integer('widget_id').primaryKey().references(() => dashboardWidgets.id, { onDelete: 'cascade' }),
  data: jsonb('data'), // The actual result set
  hash: varchar('hash', { length: 255 }), // Hash of query + filters
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const apiEndpoints = pgTable('api_endpoints', {
  id: serial('id').primaryKey(),
  workspaceId: integer('workspace_id'), // Nullable for future compatibility
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  version: integer('version').default(1),
  method: varchar('method', { length: 50 }).default('POST'),
  endpointType: varchar('endpoint_type', { length: 100 }),
  
  knowledgeSources: jsonb('knowledge_sources'),
  workflow: jsonb('workflow'),
  inputSchema: jsonb('input_schema'),
  outputSchema: jsonb('output_schema'),
  
  systemPrompt: text('system_prompt'),
  temperature: numeric('temperature', { precision: 3, scale: 2 }),
  maxTokens: integer('max_tokens'),
  streamEnabled: boolean('stream_enabled').default(false),
  
  authenticationType: varchar('authentication_type', { length: 50 }).default('api_key'),
  requestsPerMinute: integer('requests_per_minute').default(60),
  dailyQuota: integer('daily_quota'),
  monthlyQuota: integer('monthly_quota'),
  timeout: integer('timeout').default(30),
  
  isPublished: boolean('is_published').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// SaaS Expansion Tables

export const supportTickets = pgTable('support_tickets', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  subject: varchar('subject', { length: 255 }).notNull(),
  message: text('message').notNull(),
  status: varchar('status', { length: 50 }).default('pending'), // 'pending', 'working', 'resolved'
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const pricingPlans = pgTable('pricing_plans', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  credits: integer('credits').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 10 }).default('USD'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
