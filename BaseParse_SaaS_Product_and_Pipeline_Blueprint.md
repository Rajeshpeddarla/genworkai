# BaseParse SaaS - Product & Pipeline Blueprint

## Vision

BaseParse is a developer-first Document Intelligence API that converts
complex PDFs and DOCX files into AI-ready knowledge while preserving
LaTeX, diagrams, structure and metadata.

## Product Positioning

-   Developer-first API
-   Powers GenWorkAI internally
-   Standalone SaaS
-   Vision-native parsing
-   Portable Markdown output

## Core Features

-   PDF & DOCX parsing
-   LaTeX preservation
-   Diagram detection and extraction
-   Structured Markdown
-   REST API
-   API Keys
-   Playground
-   Usage dashboard
-   Billing
-   Documentation

## Website Structure

### Hero

Vision-native document parsing for developers.

### Features

-   Accurate LaTeX
-   Diagram extraction
-   Portable Markdown
-   Async API
-   High-quality vision parsing

### Playground

Upload a document, inspect Markdown, preview diagrams, download results.

### API

Interactive documentation with SDK examples.

### Dashboard

API keys, usage, billing, jobs, history.

## Pipeline

1.  Upload document.
2.  FastAPI validates request.
3.  Redis queues background job.
4.  Worker rasterizes PDF using pypdfium2.
5.  Gemini Vision returns structured JSON (markdown + diagram
    coordinates).
6.  Pillow crops diagrams and converts to WebP.
7.  Asset Manager assigns UUIDs and stores Base64 asset payloads.
8.  Knowledge Representation is created:
    -   metadata
    -   nodes
    -   assets
    -   markdown
9.  Persist to Supabase.
10. Return API response.

## Internal Architecture

Next.js -\> FastAPI -\> Redis -\> Worker -\> Vision Provider -\>
Knowledge Representation -\> Supabase

## Future Roadmap

Phase 1: - PDF - DOCX - Dashboard - Playground - API Keys - Billing

Phase 2: - Markdown - Batch jobs - Webhooks - SDKs

Phase 3: - Websites - GitHub - Databases

Phase 4: - OCR fallback - Formula enhancement - Table intelligence -
Image understanding

## Long-term Goal

Every knowledge source should produce the same Knowledge Representation
so downstream AI systems never depend on the original file format.
