import { pgTable, serial, text, timestamp, varchar, jsonb, integer, vector, boolean, uuid } from 'drizzle-orm/pg-core';
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

  createdAt: timestamp('created_at').defaultNow(),
});

export const systemConfig = pgTable('system_config', {
  key: varchar('key', { length: 255 }).primaryKey(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
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
  sourceId: integer('source_id'), // Will be linked to knowledgeSources once it's created below

  title: varchar('title', { length: 255 }).notNull(),
  sourceType: varchar('source_type', { length: 50 }).notNull(), // pdf, docx, url
  sourceUrl: text('source_url'), // the filename or url
  summary: text('summary'),
  classification: varchar('classification', { length: 100 }),
  topics: jsonb('topics'),
  keywords: jsonb('keywords'),
  content: text('content'), // Source Document
  knowledgeContent: text('knowledge_content'), // Knowledge Document
  embeddingContent: text('embedding_content'), // Embedding Document
  metadata: jsonb('metadata'), // any extra info
  sizeBytes: integer('size_bytes').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const documentChunks = pgTable('document_chunks', {
  id: serial('id').primaryKey(),
  documentId: integer('document_id').references(() => documents.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  // bge-m3 produces 1024-dimensional embeddings
  embedding: vector('embedding', { dimensions: 1024 }),
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
  kbId: integer('kb_id').references(() => knowledgeBases.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // github, database, website, folder, file
  configuration: jsonb('configuration'), // credentials, urls, etc.
  classification: jsonb('classification'), // category, type, language
  
  // Health Tracking
  lastSyncAt: timestamp('last_sync_at'),
  lastSuccessfulSyncAt: timestamp('last_successful_sync_at'),
  syncStatus: varchar('sync_status', { length: 50 }).default('pending'), // pending, syncing, success, failed
  documentCount: integer('document_count').default(0),
  chunkCount: integer('chunk_count').default(0),

  // Processing Stats
  filesProcessed: integer('files_processed').default(0),
  chunksGenerated: integer('chunks_generated').default(0),
  embeddingsGenerated: integer('embeddings_generated').default(0),
  errorsCount: integer('errors_count').default(0),

  // Optimization
  latestHash: varchar('latest_hash', { length: 255 }), // commit hash, schema hash

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
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
  status: varchar('status', { length: 50 }).default('queued'), // queued, processing, completed, failed
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
  keyHash: varchar('key_hash', { length: 255 }).notNull(), // The hashed key string
  name: varchar('name', { length: 255 }).notNull(),
  permissionLevel: varchar('permission_level', { length: 50 }).default('read_only'), // 'read_only' | 'read_generate'
  createdAt: timestamp('created_at').defaultNow(),
  lastUsedAt: timestamp('last_used_at'),
});

export const mcpAuditLogs = pgTable('mcp_audit_logs', {
  id: serial('id').primaryKey(),
  serverId: integer('server_id').references(() => mcpServers.id, { onDelete: 'cascade' }),
  apiKeyId: integer('api_key_id').references(() => mcpApiKeys.id, { onDelete: 'set null' }),
  toolName: varchar('tool_name', { length: 255 }).notNull(),
  requestPayload: jsonb('request_payload'),
  responseStatus: varchar('response_status', { length: 50 }), // 'success' | 'error'
  durationMs: integer('duration_ms'),
  createdAt: timestamp('created_at').defaultNow(),
});
