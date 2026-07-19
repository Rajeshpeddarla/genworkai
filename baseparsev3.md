# BaseParse V3 Architecture
## Building the Ultimate Document Intelligence API

**Version:** 3.0 (Production Architecture)

**Status:** Final Design

**Goal:**
Build the most affordable and developer-friendly Document Intelligence API capable of parsing any document into structured, AI-ready data **without losing any information**.

---

# Vision

BaseParse is **not** an OCR API.

BaseParse is **not** a Markdown converter.

BaseParse is a **Document Intelligence API**.

The objective is simple:

> Convert any document into a structured digital representation while preserving **100% of the document's information**.

That means preserving:

- Text
- Reading order
- Images
- Tables
- Mathematical equations
- Charts
- Graphs
- Diagrams
- Captions
- Metadata
- Hierarchy
- Layout relationships
- Page references

The output should be rich enough that another application could almost reconstruct the original document.

---

# Core Principles

## Principle 1 — Zero Data Loss

No information should disappear during parsing.

Every element inside a document should be represented.

If a document contains

- 8 images
- 6 tables
- 14 equations
- 2 graphs

the API response must contain all of them.

---

## Principle 2 — AI Understands, BaseParse Preserves

Gemini is responsible for understanding.

BaseParse is responsible for preserving.

Gemini should never become responsible for cropping, storing or organizing document assets.

Instead:

```
Gemini

↓

Understanding

↓

BaseParse

↓

Extraction

↓

Storage

↓

Unified JSON
```

---

## Principle 3 — Developer First

Developers should never have to write another OCR pipeline.

One request should return everything.

---

# High Level Architecture

```
                    Upload Document
                           │
                           ▼
                  Authentication
                           │
                           ▼
                   SHA256 Checksum
                           │
              Duplicate Document?
                 ┌───────────────┐
            YES  │               │ NO
                 ▼               ▼
          Return Cached      Processing
                               │
                               ▼
                  Rasterize Every Page
                  (pypdfium2 @300 DPI)
                               │
                               ▼
                 Gemini Document Analysis
                               │
                               ▼
               Structured Document JSON
                               │
                               ▼
                Physical Asset Extraction
                               │
        ┌────────────┬─────────────┬────────────┐
        ▼            ▼             ▼            ▼
      Images      Tables      Equations     Diagrams
        │            │             │            │
        └────────────┴─────────────┴────────────┘
                               │
                               ▼
                    Upload Assets
                    (Supabase Storage)
                               │
                               ▼
                  Chunk Generation
                               │
                               ▼
           Optional Embeddings (Pro)
                               │
                               ▼
               Final Unified JSON
                               │
                               ▼
                   API Response
```

---

# Technology Stack

## AI

### Gemini 3.1 Flash Lite

Gemini performs

- OCR
- Layout understanding
- Reading order
- Formula understanding
- Diagram understanding
- Table understanding
- Image understanding
- Metadata generation
- Caption generation

Gemini is the only paid AI provider.

---

## Embeddings

BAAI/bge-m3

Used only for

- Pro
- Enterprise

Runs locally on CPU.

No API cost.

---

## Reranking

BAAI/bge-reranker-v2

Only used for

Search API.

---

## Storage

Supabase

Stores

- Documents
- Images
- Tables
- Diagrams
- Equations
- Chunks
- Metadata
- Embeddings

---

# Complete Processing Pipeline

## Step 1

Receive document

Supported

- PDF
- DOCX
- PPTX
- PNG
- JPG
- TIFF

---

## Step 2

Generate SHA256

```
Upload

↓

SHA256

↓

Already Parsed?

↓

Return Cached Result
```

Duplicate documents never consume Gemini again.

---

## Step 3

Rasterize Every Page

Every page becomes

```
Page 1 → PNG

Page 2 → PNG

Page 3 → PNG

...
```

using

```
pypdfium2
```

at

```
300 DPI
```

This guarantees every visual element exists as pixels before AI analysis.

---

## Step 4

Gemini Document Intelligence

Gemini receives

- Original PDF
- Rasterized pages

Gemini returns

- Reading order
- Headings
- Paragraphs
- Tables
- Formula locations
- Image descriptions
- Diagram descriptions
- Captions
- Relationships
- Metadata
- Chunk suggestions

Gemini is **never responsible for storing assets**.

---

## Step 5

Physical Asset Extraction

BaseParse extracts every physical object.

This includes

### Images

Crop

Store PNG

Upload

Generate URL

---

### Tables

Crop

Store PNG

Generate Markdown

Generate Structured JSON

Upload image

---

### Equations

Crop

Store PNG

Generate LaTeX

Generate MathML (future)

---

### Diagrams

Crop

Store PNG

Generate description

Generate caption

---

### Charts

Crop

Store PNG

Generate description

---

### Graphs

Crop

Store PNG

Generate description

---

Everything is preserved.

Nothing disappears.

---

# Storage Structure

```
documents/

    document_id/

        original.pdf

        pages/

            page_001.png

            page_002.png

        images/

            image_001.png

            image_002.png

        tables/

            table_001.png

        equations/

            equation_001.png

        diagrams/

            diagram_001.png

        metadata.json

        chunks.json

        embeddings.bin
```

---

# Unified Document Model

```
Document

├── Metadata

├── Pages

├── Sections

├── Images

├── Tables

├── Diagrams

├── Equations

├── Captions

├── References

├── Chunks

├── Relationships

└── Embeddings
```

---

# Standard Response JSON

The canonical representation of every document is an ordered list of **content blocks**.

Every page preserves the exact reading order of the original document.

Each block represents one semantic element such as:

- Heading
- Paragraph
- List
- Table
- Image
- Diagram
- Formula
- Code Block
- Chart
- Caption
- Footnote

This allows AI applications to reconstruct the document naturally while also giving developers structured access to every asset.

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
    "created_at": "",
    "keywords": []
  },

  "pages": [
    {
      "page": 1,

      "width": 2480,
      "height": 3508,

      "blocks": [

        {
          "id": "heading_001",
          "type": "heading",
          "level": 2,
          "text": "2. Binary Search Tree",
          "bbox": [120, 180, 890, 260]
        },

        {
          "id": "paragraph_001",
          "type": "paragraph",
          "text": "A binary search tree stores values in sorted order...",
          "bbox": [120, 280, 1900, 640]
        },

        {
          "id": "diagram_001",
          "type": "diagram",

          "caption": "Figure 2",

          "description": "Binary search tree containing root node 8 with left and right child nodes.",

          "image_url": "https://.../diagram_001.png",

          "bbox": [200,700,1800,1800]
        },

        {
          "id": "paragraph_002",
          "type": "paragraph",
          "text": "The height of a binary search tree...",
          "bbox": [120,1850,1900,2100]
        },

        {
          "id": "equation_001",
          "type": "equation",

          "latex": "h = \\log_2(n)",

          "image_url": "https://.../equation_001.png",

          "bbox": [500,2200,1400,2380]
        },

        {
          "id": "table_001",
          "type": "table",

          "caption": "Table 3",

          "markdown": "| Nodes | Height |\n|---|---|\n|7|3|\n|15|4|",

          "rows": [
            ["Nodes","Height"],
            ["7","3"],
            ["15","4"]
          ],

          "image_url": "https://.../table_001.png",

          "bbox": [200,2450,1800,3200]
        }

      ]
    }
  ],

  "chunks": [],

  "embeddings": []
}
```

---

# Global Asset Indexes

For convenience, BaseParse also exposes top-level indexes.

These are generated from the page blocks.

```json
{
    "images": [],
    "tables": [],
    "equations": [],
    "diagrams": [],
    "charts": []
}
```

These indexes should **never be considered the source of truth**.

The canonical representation is always:

```
pages

↓

blocks
```

This guarantees that the original reading order is never lost.

---

# API Products

## Parse API

```
POST /v1/parse
```

Returns

- Markdown
- JSON
- Images
- Tables
- Equations
- Diagrams
- Metadata
- Chunks

---

## OCR API

```
POST /v1/ocr
```

Returns

Plain text.

---

## Embedding API

```
POST /v1/embed
```

Returns

1024-dimensional vectors.

---

## Chunk API

```
POST /v1/chunks
```

Returns

Semantic chunks.

---

## Search API

Future

```
POST /v1/search
```

Uses

- Embeddings
- Reranker

---

## Chat API

Future

```
POST /v1/chat
```

Uses

Document Intelligence output.

---

# Cost Optimization

## SHA256 Document Cache

Never parse identical documents twice.

---

## Image Cache

Every extracted image receives

```
SHA256
```

Duplicate images are reused.

No duplicate uploads.

---

## Embedding Cache

Never regenerate embeddings.

---

## Local Embeddings

Embeddings use

```
BAAI/bge-m3
```

No API cost.

---

## Optional Embeddings

Generated only for

- Pro
- Enterprise

---

# Pricing

## Free

100 pages

Includes

- Parse
- OCR
- Markdown
- JSON
- Images
- Tables
- Equations
- Diagrams

No embeddings.

---

## Starter ($10)

5000 pages

Everything in Free

+

API

+

Batch

+

Higher rate limits

---

## Pro ($25)

15000 pages

Everything

+

Embeddings

+

Chunking

+

Citation mapping

+

Search-ready output

---

## Enterprise

Custom

Includes

- Unlimited workspaces
- Priority workers
- Team API Keys
- Webhooks
- Search API
- Reranking
- Advanced integrations

---

# Future APIs

```
/v1/parse

/v1/ocr

/v1/embed

/v1/chunks

/v1/search

/v1/chat

/v1/summarize

/v1/extract/images

/v1/extract/tables

/v1/extract/equations

/v1/extract/diagrams

/v1/knowledge-graph
```

---

# Competitive Positioning

| Feature | OCR APIs | BaseParse |
|----------|----------|-----------|
| OCR | ✅ | ✅ |
| Reading Order | Limited | ✅ |
| Images | Partial | ✅ |
| Physical Image Extraction | ❌ | ✅ |
| Tables | Partial | ✅ |
| Table Images | ❌ | ✅ |
| Equations | Partial | ✅ |
| Equation Images | ❌ | ✅ |
| Diagrams | ❌ | ✅ |
| Diagram Images | ✅ |
| Metadata | Limited | ✅ |
| Chunks | ❌ | ✅ |
| Embeddings | ❌ | ✅ |
| AI-ready JSON | ❌ | ✅ |

---

# Final Mission

BaseParse is not trying to become the cheapest OCR service.

BaseParse is building the **Document Intelligence Layer for AI**.

Every document should become a complete digital representation that preserves **every meaningful element**—text, layout, images, tables, equations, diagrams, and relationships—so developers never need to build another parsing pipeline.

The ultimate promise of BaseParse is:

> **"Upload any document. Receive everything back—structured, searchable, AI-ready, and with zero meaningful information loss."**

This philosophy drives every design decision in BaseParse.


# Document Fidelity Checklist

A document is considered successfully parsed only if **all meaningful information has been preserved**.

| Feature | Status | Description |
|----------|:------:|-------------|
| Original Text | ✅ | Preserve all readable text. |
| Reading Order | ✅ | Maintain the original sequence of content blocks. |
| Headings | ✅ | Preserve heading hierarchy. |
| Paragraphs | ✅ | Preserve paragraph boundaries. |
| Lists | ✅ | Preserve ordered and unordered lists. |
| Tables | ✅ | Return structured rows and columns. |
| Table Images | ✅ | Return cropped table image. |
| Table Markdown | ✅ | Generate Markdown representation. |
| Images | ✅ | Return every embedded image. |
| Image Descriptions | ✅ | AI-generated description for accessibility and search. |
| Diagrams | ✅ | Preserve diagrams as cropped images with descriptions. |
| Charts | ✅ | Preserve graphs and charts with descriptions. |
| Equations | ✅ | Preserve equations as both LaTeX and cropped images. |
| Captions | ✅ | Link captions to their corresponding figures/tables. |
| Page Numbers | ✅ | Every block belongs to a page. |
| Bounding Boxes | ✅ | Every visual element stores coordinates. |
| Metadata | ✅ | Preserve title, author, language, creation date, keywords, etc. |
| Chunks | ✅ | Generate semantic chunks for RAG. |
| Embeddings (Pro+) | ✅ | Optional semantic vectors using BAAI/bge-m3. |
| Asset URLs | ✅ | Every extracted visual asset has a permanent URL. |
| Relationships | ✅ | Preserve associations between text, figures, tables, and captions. |
| Search Ready | ✅ | Output is optimized for semantic search and AI retrieval. |
| AI Ready | ✅ | Structured JSON can be consumed directly by LLMs and AI agents. |

---

## BaseParse Quality Guarantee

Every successful parse should satisfy the following principles:

- **No meaningful information is discarded.**
- **Every visual asset is preserved as a physical image.**
- **Every equation is available as both LaTeX and an image.**
- **Every table is available as structured JSON, Markdown, and an image.**
- **The original reading order is preserved using ordered page blocks.**
- **Developers should never need to reopen the original PDF to access missing content.**
- **The output should be complete enough to reconstruct the document or power AI applications such as RAG, search, chat, summarization, and knowledge extraction.**



