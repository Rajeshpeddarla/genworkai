CREATE TABLE "document_chunks" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_id" integer,
	"content" text NOT NULL,
	"embedding" vector(1024)
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"kb_id" integer,
	"source_id" integer,
	"title" varchar(255) NOT NULL,
	"source_type" varchar(50) NOT NULL,
	"source_url" text,
	"summary" text,
	"classification" varchar(100),
	"topics" jsonb,
	"keywords" jsonb,
	"content" text,
	"knowledge_content" text,
	"embedding_content" text,
	"metadata" jsonb,
	"size_bytes" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "knowledge_bases" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"color" varchar(50),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "knowledge_sources" (
	"id" serial PRIMARY KEY NOT NULL,
	"kb_id" integer,
	"name" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"configuration" jsonb,
	"classification" jsonb,
	"last_sync_at" timestamp,
	"last_successful_sync_at" timestamp,
	"sync_status" varchar(50) DEFAULT 'pending',
	"document_count" integer DEFAULT 0,
	"chunk_count" integer DEFAULT 0,
	"files_processed" integer DEFAULT 0,
	"chunks_generated" integer DEFAULT 0,
	"embeddings_generated" integer DEFAULT 0,
	"errors_count" integer DEFAULT 0,
	"latest_hash" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "source_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_id" integer,
	"hash" varchar(255) NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sync_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_id" integer,
	"status" varchar(50) DEFAULT 'queued',
	"error" text,
	"started_at" timestamp,
	"finished_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "workspace_artifact_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"artifact_id" integer,
	"version_number" integer NOT NULL,
	"content" text NOT NULL,
	"source_doc_ids" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "workspace_artifacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"chat_id" integer,
	"name" varchar(255) NOT NULL,
	"file_type" varchar(50) NOT NULL,
	"category" varchar(100),
	"status" varchar(50) DEFAULT 'draft',
	"is_pinned" boolean DEFAULT false,
	"relationships" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "workspace_chats" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"kb_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "workspace_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"chat_id" integer,
	"role" varchar(50) NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "document_chunks" ADD CONSTRAINT "document_chunks_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_kb_id_knowledge_bases_id_fk" FOREIGN KEY ("kb_id") REFERENCES "public"."knowledge_bases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_sources" ADD CONSTRAINT "knowledge_sources_kb_id_knowledge_bases_id_fk" FOREIGN KEY ("kb_id") REFERENCES "public"."knowledge_bases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_snapshots" ADD CONSTRAINT "source_snapshots_source_id_knowledge_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."knowledge_sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_jobs" ADD CONSTRAINT "sync_jobs_source_id_knowledge_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."knowledge_sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_artifact_versions" ADD CONSTRAINT "workspace_artifact_versions_artifact_id_workspace_artifacts_id_fk" FOREIGN KEY ("artifact_id") REFERENCES "public"."workspace_artifacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_artifacts" ADD CONSTRAINT "workspace_artifacts_chat_id_workspace_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."workspace_chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_chats" ADD CONSTRAINT "workspace_chats_kb_id_knowledge_bases_id_fk" FOREIGN KEY ("kb_id") REFERENCES "public"."knowledge_bases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_messages" ADD CONSTRAINT "workspace_messages_chat_id_workspace_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."workspace_chats"("id") ON DELETE cascade ON UPDATE no action;