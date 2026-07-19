# BaseParse V2 Architecture
## Building the Developer-First Document Intelligence API

**Version:** 2.0  
**Status:** Architecture Finalized  
**Author:** BaseParse Engineering  
**Vision:** Build the world's most affordable Document Intelligence API for AI applications.

---

# Executive Summary

BaseParse is **not an OCR service**.

It is **Document Intelligence as an API**.

The mission is simple:

> Convert any document into structured, AI-ready data with minimal cost while maintaining enterprise-grade quality.

Instead of returning plain text, BaseParse returns rich structured information including:

- Document structure
- Reading order
- Markdown
- Images
- Tables
- Mathematical equations
- Diagrams
- Metadata
- Chunks
- Optional embeddings
- Citation mapping

The entire platform is optimized around:

- Low operational cost
- CPU-friendly infrastructure
- Single AI provider (Gemini)
- Fast API responses
- AI-native developer experience

---

# Product Vision

```
                    Any Document

     PDF • DOCX • PPTX • Images • Scanned PDFs

                         │
                         ▼
                  BaseParse Engine
                         │
        ┌─────────────────────────────────────┐
        │                                     │
        │ Layout Understanding                │
        │ Document Understanding              │
        │ Formula Understanding               │
        │ Table Understanding                 │
        │ Diagram Understanding               │
        │ Metadata Generation                 │
        │ Chunk Generation                    │
        └─────────────────────────────────────┘
                         │
                         ▼
              Structured Intelligence JSON
                         │
          ┌──────────────┴──────────────┐
          ▼                             ▼
     Developer APIs               AI Applications
```

---

# Design Principles

## 1. One AI Provider

The entire intelligence layer is powered by:

- Gemini 3.1 Flash Lite

Reasons:

- Lowest cost
- Excellent multimodal understanding
- Native PDF understanding
- Great at mathematical formulas
- Great at diagrams
- Great at tables
- No infrastructure complexity

No Azure.

No Mistral.

No OpenAI.

No Claude.

Keeping a single provider dramatically simplifies:

- Billing
- Infrastructure
- Maintenance
- Reliability

---

## 2. Own the Output

BaseParse never exposes raw Gemini responses.

Instead every document is converted into a unified internal format.

```
Gemini

↓

Normalize

↓

Structured JSON

↓

Developer API
```

This allows:

- Provider independence
- Stable API versions
- Future parser upgrades
- Consistent developer experience

---

## 3. Intelligence over OCR

Traditional OCR pipeline:

```
PDF

↓

OCR

↓

Text
```

BaseParse pipeline:

```
PDF

↓

Document Intelligence

↓

Structured Knowledge
```

---

# Technology Stack

## AI

### Document Intelligence

```
Gemini 3.1 Flash Lite
```

Responsibilities:

- OCR
- Layout detection
- Table understanding
- Formula understanding
- Diagram description
- Image understanding
- Metadata generation
- Reading order

---

## Embeddings

```
BAAI/bge-m3
```

Runs locally.

CPU only.

Free.

1024-dimensional vectors.

Responsibilities:

- Semantic search
- RAG
- Similarity
- Knowledge retrieval

---

## Reranker

```
BAAI/bge-reranker-v2
```

Runs locally.

CPU only.

Responsibilities:

- Search reranking
- Better retrieval quality

Only used for Search API.

---

## Backend

- Next.js
- Node.js
- FastAPI Worker
- Redis Queue

---

## Database

Supabase

Stores:

- documents
- pages
- chunks
- images
- embeddings
- metadata

---

# Core Architecture

```
                    Upload Document
                           │
                           ▼
                     SHA256 Hash
                           │
                  Duplicate Document?
                    ┌──────────────┐
               YES  │              │ NO
                    ▼              ▼
           Return Cached      Detect Type
                                  │
                                  ▼
                     Searchable PDF?
                     ┌──────────────┐
                YES  │              │ NO
                     ▼              ▼
                pdf-parse       Gemini
                     │              │
                     └──────┬───────┘
                            ▼
                  Normalize JSON
                            ▼
                  Extract Images
                            ▼
                  Extract Tables
                            ▼
                 Extract Equations
                            ▼
                 Generate Metadata
                            ▼
                  Generate Chunks
                            ▼
             Optional Embeddings
                            ▼
                     Store Results
                            ▼
                    Return Response
```

---

# Processing Flow

## Step 1

Receive document

Supported:

- PDF
- DOCX
- PPTX
- Images

---

## Step 2

Generate SHA256

```
Document

↓

SHA256

↓

Already processed?

↓

Return cached result
```

Benefits:

- Huge API savings
- Faster responses
- No duplicate Gemini requests

---

## Step 3

Determine document type

If searchable PDF

```
pdf-parse
```

If scanned

```
Gemini
```

Only invoke Gemini when necessary.

---

## Step 4

Document Intelligence

Gemini extracts:

- Text
- Images
- Tables
- Equations
- Layout
- Reading order
- Metadata
- Captions
- Diagram descriptions

---

## Step 5

Normalization

Everything becomes one format.

Future providers can be swapped without breaking the API.

---

## Step 6

Chunk Generation

Semantic chunks.

Each chunk stores:

- page
- section
- heading
- citation
- content

---

## Step 7 (Pro)

Generate embeddings

Using

```
BAAI/bge-m3
```

---

## Step 8

Persist everything.

---

# Internal Data Model

```
Document

├── Metadata

├── Pages

├── Images

├── Tables

├── Equations

├── Chunks

├── Citations

├── Embeddings

└── Relationships
```

---

# Standard Output JSON

```json
{
  "document": {
    "id": "",
    "title": "",
    "language": "",
    "pages": 48,
    "checksum": ""
  },

  "metadata": {
    "author": "",
    "createdAt": "",
    "keywords": []
  },

  "pages": [],

  "tables": [],

  "images": [],

  "equations": [],

  "chunks": [],

  "citations": [],

  "embeddings": []
}
```

---

# API Products

## Parse API

```
POST /v1/parse
```

Returns:

- Markdown
- JSON
- Metadata
- Tables
- Images
- Formulas
- Chunks

---

## OCR API

```
POST /v1/ocr
```

Returns:

Plain extracted text.

---

## Embedding API

(Pro)

```
POST /v1/embed
```

Returns:

1024-dimensional embeddings.

---

## Chunk API

(Pro)

```
POST /v1/chunks
```

Returns:

Semantic chunks.

---

## Search API

(Enterprise)

```
POST /v1/search
```

Uses

- embeddings
- reranker

---

## Chat API

(Future)

```
POST /v1/chat
```

Uses

- parsed document
- search
- reranker

---

# Cost Optimization Strategy

This is where BaseParse wins.

---

## SHA256 Cache

Never parse identical documents twice.

```
PDF

↓

Hash

↓

Already exists?

↓

Return
```

---

## Embedding Cache

Never embed identical chunks twice.

---

## Optional Embeddings

Embeddings generated only for:

- Pro
- Enterprise

Free users do not consume embedding resources.

---

## Background Queue

Parsing happens asynchronously.

User receives:

```
Processing...
```

Instead of waiting.

---

## Page-Level Processing

Every page stores:

- processing status
- processing time
- token usage
- estimated cost

Benefits:

- retry failed pages
- progress tracking
- analytics

---

# Pricing Strategy

## Free

- 100 pages
- Parse API
- OCR
- Markdown
- JSON
- Tables
- Images
- Formulas

No embeddings.

---

## Starter ($10)

5000 pages

Includes

- API
- JSON
- Markdown
- OCR
- Tables
- Images
- Formulas
- Batch uploads

---

## Pro ($25)

15000 pages

Everything in Starter

Plus

- Embeddings
- Semantic chunks
- Citation mapping
- Search-ready output

---

## Enterprise

Custom pricing

Includes

- Unlimited projects
- Higher rate limits
- Priority workers
- Dedicated queues
- Webhooks
- Team workspaces
- Advanced search
- Reranking
- Dedicated support

Enterprise is feature-driven, not page-driven.

---

# Competitive Positioning

| Service | OCR | Tables | Formulas | Images | JSON | Embeddings |
|----------|-----|---------|-----------|---------|------|------------|
| Azure | ✅ | ✅ | Limited | Limited | Partial | ❌ |
| Mistral OCR | ✅ | Partial | Limited | Limited | Markdown | ❌ |
| Mathpix | ✅ | Excellent | Excellent | Limited | Partial | ❌ |
| BaseParse | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

# Roadmap

## V1

Launch

Features

- Gemini parsing
- Searchable PDF detection
- OCR
- Markdown
- Structured JSON
- Image extraction
- Table extraction
- Formula extraction
- SHA256 caching
- Async queue

---

## V2

AI Search

Features

- BAAI embeddings
- Semantic chunks
- Citation mapping
- Search-ready JSON
- Batch APIs
- Search API

---

## V3

Knowledge Intelligence

Features

- Knowledge Graph
- Entity extraction
- Relationship mapping
- Hybrid search
- AI Agent APIs
- Chat API
- Workspace Intelligence

---

# Long-Term Vision

BaseParse is not competing to become another OCR provider.

BaseParse is becoming the foundational Document Intelligence layer for AI.

Developers should think:

> "If I have a document, I send it to BaseParse."

And receive back:

- Structured JSON
- AI-ready chunks
- Images
- Tables
- Equations
- Metadata
- Embeddings
- Search-ready intelligence

without worrying about OCR, layouts, or parsing pipelines.

---

# Final Mission

**BaseParse transforms every document into structured intelligence.**

The goal is not to extract text.

The goal is to make every document understandable by AI.