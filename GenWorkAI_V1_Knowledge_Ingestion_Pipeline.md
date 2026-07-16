# GenWorkAI V1 Knowledge Ingestion Pipeline (Implementation Blueprint)

> **Status:** Phase 1 Implementation Plan\
> **Goal:** Build a production-ready, CPU-only document ingestion
> pipeline that is simple, scalable, and extensible.

------------------------------------------------------------------------

# 1. Vision

GenWorkAI is a Knowledge Intelligence Platform.

Every knowledge source (PDF, DOCX, Markdown, Websites, GitHub,
Databases, etc.) must eventually be transformed into one common internal
format.

    Knowledge Source
          ↓
    Knowledge Pipeline
          ↓
    Knowledge Representation
          ↓
    AI Chat / Search / Workspace / Knowledge Base

------------------------------------------------------------------------

# 2. Current Constraints

## Budget

-   One VPS only
-   Planned VPS:
    -   4 vCPU
    -   4 GB RAM
    -   60 GB NVMe
    -   4 TB Bandwidth
-   No GPU
-   No Kubernetes
-   No paid OCR APIs
-   No paid document APIs

## Existing Stack

-   Next.js
-   Supabase Auth
-   Supabase PostgreSQL
-   pgvector
-   Supabase Storage
-   Docker
-   GitLab CI/CD experience

------------------------------------------------------------------------

# 3. Phase 1 Scope

Supported:

-   PDF
-   DOCX
-   Markdown (.md)
-   Text (.txt)

Not supported yet:

-   PPTX
-   XLSX
-   Images
-   OCR
-   Formula OCR
-   Vector extraction
-   Advanced layout analysis

Reason: Deliver a stable end-to-end product before adding expensive
features.

------------------------------------------------------------------------

# 4. High Level Architecture

``` text
User
 │
 ▼
Next.js
 │
 ▼
Supabase Storage
 │
 ▼
Create Processing Job
 │
 ▼
FastAPI API
 │
 ▼
Redis Queue
 │
 ▼
Worker
 │
 ▼
Document Parser
 │
 ▼
Knowledge Representation
 │
 ▼
Chunk Generator
 │
 ▼
Embedding Generator
 │
 ▼
Supabase PostgreSQL + pgvector
```

------------------------------------------------------------------------

# 5. Live Pipeline

## Step 1

User uploads a file.

Supported:

-   PDF
-   DOCX
-   MD
-   TXT

Store original file in Supabase Storage.

Create processing job.

Return immediately.

------------------------------------------------------------------------

## Step 2

FastAPI places job in Redis.

Purpose:

-   Async processing
-   Better UX
-   Retry support

------------------------------------------------------------------------

## Step 3

Worker downloads file using signed URL.

No file passes through multiple APIs.

------------------------------------------------------------------------

## Step 4

Document Router

    PDF
    DOCX
    MD
    TXT

Each type uses a dedicated parser.

------------------------------------------------------------------------

## Step 5

Extract Native Content

### PDF

Libraries

-   pypdfium2
-   pdfplumber

Extract

-   text
-   headings (basic)
-   page metadata

### DOCX

Library

-   python-docx

Extract

-   paragraphs
-   headings
-   lists

### Markdown

Read UTF-8

Parse headings

Lists

Code blocks

### TXT

Read file

Split paragraphs

------------------------------------------------------------------------

## Step 6

Build a Simple Knowledge Representation (AST)

Output example:

``` json
{
  "document": {
    "id": "doc_123",
    "title": "Operating Systems",
    "type": "pdf"
  },
  "nodes": [
    {
      "type": "heading",
      "text": "Chapter 1"
    },
    {
      "type": "paragraph",
      "text": "An operating system is system software..."
    }
  ]
}
```

Phase 1 node types:

-   Heading
-   Paragraph
-   List
-   Code Block
-   Table Placeholder
-   Image Placeholder

Purpose:

Normalize every document into one common structure.

------------------------------------------------------------------------

## Step 7

Chunking

Chunk by headings and paragraphs.

Never split inside the same paragraph.

Simple rules only.

------------------------------------------------------------------------

## Step 8

Generate Embeddings

Model:

BAAI/bge-m3 (CPU)

Output:

One embedding per chunk.

Store in pgvector.

------------------------------------------------------------------------

## Step 9

Store

Save:

-   Document metadata
-   AST
-   Chunks
-   Embeddings

Update status = completed.

------------------------------------------------------------------------

# 6. Pipeline Output

The pipeline does NOT return plain text.

It returns a normalized knowledge representation.

``` json
{
  "document": {},
  "nodes": [],
  "chunks": [],
  "metadata": {}
}
```

Everything in GenWorkAI (chat, search, citations, workspace) consumes
this structure.

------------------------------------------------------------------------

# 7. Database

Tables

-   documents
-   processing_jobs
-   document_nodes
-   chunks
-   embeddings

Storage

-   documents bucket

------------------------------------------------------------------------

# 8. Docker Services

-   nextjs
-   extraction-api
-   extraction-worker
-   redis

Supabase provides:

-   Auth
-   Storage
-   PostgreSQL
-   pgvector

------------------------------------------------------------------------

# 9. Phase Roadmap

## Phase 1

-   PDF
-   DOCX
-   MD
-   TXT
-   Simple AST
-   Chunking
-   Embeddings
-   Chat

## Phase 2

-   Conditional OCR (only scanned pages)

## Phase 3

-   Image extraction

## Phase 4

-   Table extraction

## Phase 5

-   Formula OCR

## Phase 6

-   Vector diagrams

## Phase 7

-   Advanced semantic AST
-   Cross references
-   Knowledge graph

------------------------------------------------------------------------

# 10. Success Criteria

-   CPU only
-   Runs locally via Docker Compose
-   Deploys unchanged to a single VPS
-   No paid extraction services
-   One unified pipeline for all supported document types
-   Every document becomes a reusable knowledge representation rather
    than plain extracted text
