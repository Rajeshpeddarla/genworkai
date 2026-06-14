# GenWorkAI V2 Product Vision

## Mission

GenWorkAI transforms scattered documents, files, URLs, media, and technical assets into reusable knowledge that can be searched, understood, generated from, and connected to any AI system.

The goal is not to become another AI chat application.

The goal is to become the knowledge layer between information and AI.

---

# Current Modules

## Research Studio

Research Studio is responsible for collecting, analyzing, and understanding information.

### Supported Inputs

* URLs
* Websites
* PDFs
* DOCX
* PPT/PPTX
* Images
* YouTube Videos
* CSV
* Excel Files

### Outputs

* Research Reports
* Summaries
* Key Insights
* Action Items
* Structured Analysis
* Executive Briefs

Research Studio serves as the primary information ingestion layer.

---

## File Studio

File Studio provides AI-powered file processing.

### Features

#### Image Upscaling

* 2x
* 4x
* Up to 2K

#### Background Removal

Browser-based processing.

#### OCR

Extract text from images.

#### AI Extraction

Transform extracted information into:

* Notes
* Reports
* Documentation
* Structured Data

#### Image Conversion

* PNG
* JPG
* WEBP
* SVG

File Studio serves as the file transformation layer.

---

# New Module 1: Knowledge Base

## Purpose

Knowledge Base is the permanent memory system of GenWorkAI.

Instead of analyzing files once and discarding them, users can continuously build searchable knowledge repositories.

---

## Knowledge Base Examples

### Student

Computer Science Semester 5

Contains:

* Notes
* PPTs
* Assignments
* Books
* Previous Papers

---

### Developer

Backend Documentation

Contains:

* OpenAPI Specs
* Postman Collections
* SQL Scripts
* Architecture Docs
* Markdown Files

---

### Startup

Business Knowledge

Contains:

* Research Reports
* Market Analysis
* Product Requirements
* Internal Documents

---

## Supported Sources

### Documents

* PDF
* DOCX
* PPTX
* XLSX
* CSV
* TXT
* MD

### Images

* PNG
* JPG
* WEBP

### URLs

* Websites
* Blogs
* Documentation

### Media

* YouTube Videos
* Audio Files

### Technical Assets

* JSON
* OpenAPI
* Postman Collections
* SQL Files
* Code Documentation

---

## Knowledge Processing Pipeline

Upload

↓

Extract Content

↓

Chunk Content

↓

Generate Embeddings

↓

Store in PostgreSQL + pgvector

↓

Create Searchable Knowledge Base

---

## Knowledge Base Chat

Users can chat with their own knowledge.

Examples:

### Student

Explain Unit 5.

Generate Revision Notes.

Create Important Questions.

---

### Developer

Explain API Architecture.

Generate Documentation.

Create System Overview.

---

### Startup

Generate Product Requirements.

Summarize Research Findings.

Create Market Reports.

---

## Source Grounding

Every answer should contain:

* Source Files
* Source Sections
* Supporting References

Answers should be based only on retrieved content.

If information is unavailable:

"Insufficient information found in this Knowledge Base."

---

## Search Features

### Semantic Search

Search by meaning.

### Keyword Search

Search exact words.

### Hybrid Search

Combine both methods.

### Filters

* File Type
* Date
* Source
* Tags

---

## Knowledge Outputs

Generate:

* Notes
* Reports
* Documentation
* Research Summaries
* SOPs
* Study Material

directly from stored knowledge.

---

# New Module 2: Workspace

## Purpose

Workspace converts knowledge into deliverables.

Knowledge Base stores information.

Workspace transforms information.

---

## Workspace Modes

### Prompt Mode

Generate content from instructions only.

---

### Knowledge Mode

Generate content using selected Knowledge Bases.

---

## Supported Deliverables

### Documents

* Reports
* SOPs
* Technical Documentation
* Research Papers
* Business Plans
* White Papers

---

### Presentations

* Investor Decks
* Academic Presentations
* Business Presentations
* Product Presentations

---

### Spreadsheets

* Budgets
* Reports
* Analytics
* Financial Models

---

### Markdown

* README Files
* Documentation
* Knowledge Packs

---

## Workspace Features

### Rewrite

Improve content.

### Expand

Add additional detail.

### Summarize

Condense information.

### Convert Format

Transform documents into other formats.

### Generate Tables

Create structured data tables.

### Generate Charts

Create visual summaries.

### Generate References

Create source references.

---

## Export Formats

* PDF
* DOCX
* PPTX
* XLSX
* CSV
* Markdown
* HTML

---

# New Module 3: MCP Hub

## Purpose

Allow any Knowledge Base to be connected to external AI systems.

GenWorkAI becomes an AI-ready knowledge platform.

---

## MCP Export

Every Knowledge Base can generate an MCP endpoint.

Example:

mcp.genworkai.com/kb/{id}

---

## Supported Clients

* Claude Desktop
* Cursor
* Continue
* Open WebUI
* Local LLMs
* AI Agents
* Custom Applications

---

## Example Use Cases

### Student

Build semester knowledge.

Connect it to Claude.

Ask questions directly from course materials.

---

### Developer

Build API knowledge.

Connect it to Cursor.

Generate code using project documentation.

---

### Startup

Build company knowledge.

Connect it to internal AI systems.

Generate business content from organizational knowledge.

---

## AI Knowledge Packages

Users can export Knowledge Bases as portable packages.

Example:

flutter-architecture.gwai

Contains:

* Documents
* Metadata
* Knowledge Structure
* Embeddings
* References

Packages can be:

* Shared
* Imported
* Archived
* Connected to MCP

---

# Technical Stack

Frontend

* Next.js 16
* TypeScript
* Tailwind CSS
* Framer Motion

AI Models

* DeepSeek V4 Flash
* Premium LLM APIs

Knowledge Layer

* PostgreSQL
* pgvector
* Ollama
* BGE-M3 Embeddings

Processing Layer

* Playwright
* Cheerio
* Mammoth
* PDF2JSON
* XLSX
* OfficeParser
* Tesseract

Infrastructure

* VPS
* PostgreSQL
* Ollama
* MCP SDK

---

# User Flow

Research Studio

↓

Knowledge Base

↓

Knowledge Chat

↓

Workspace

↓

Export

↓

MCP

↓

Any AI Tool

---

# Core Value Proposition

Research information.

Store knowledge permanently.

Generate professional outputs.

Connect knowledge to any AI.

Build knowledge once. Use it everywhere.
