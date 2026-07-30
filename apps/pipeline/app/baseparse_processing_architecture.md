# BaseParse Document Processing Architecture

## Overview

BaseParse is a document-parsing platform designed to process complex PDFs such as:

- Research papers
- Medical reports
- GATE and NEET examination papers
- Documents containing tables
- Formula-heavy documents
- Scanned PDFs
- Image-heavy PDFs
- Multi-column documents

The system converts each PDF page into an image, sends the image to Gemini 3.1 Flash-Lite for multimodal extraction, validates the returned JSON, and combines the page-level results into a structured hybrid JSON response.

---

## Current Processing Flow

```text
PDF Upload
    |
    v
Validate PDF
    |
    v
Create Parsing Job
    |
    v
Convert Each PDF Page to Image
    |
    v
Send Page Image to Gemini 3.1 Flash-Lite
    |
    v
Receive Structured JSON
    |
    v
Validate and Normalize Page Output
    |
    v
Retry Failed Pages
    |
    v
Merge Pages in Original Order
    |
    v
Store Final Hybrid JSON
    |
    v
Delete Temporary Images
```

---

## Why This Architecture Works

Gemini performs the heavy AI processing remotely. Therefore, the VPS mainly handles:

- File uploads
- PDF validation
- PDF-to-image conversion
- Temporary image management
- Gemini API requests
- JSON validation
- Page-result merging
- Database operations
- Object-storage operations
- Authentication
- Rate limiting
- Job queue management

A GPU is not required on the VPS when Gemini is used for document understanding.

---

## Recommended VPS Configuration

The current VPS configuration is:

```text
6 vCPU
8 GB RAM
```

This is suitable for an MVP if concurrency is controlled.

Recommended starting configuration:

```text
Active documents: 1
Concurrent page requests: 2
Worker memory limit: 4 GB
PDF rendering DPI: 150-200
Maximum page image width: 1800-2200 px
Per-page retry count: 2-3
Processing timeout: 15 minutes
```

Do not process too many pages simultaneously only because the server has six CPU cores.

PDF rendering, image encoding, network requests, JSON responses, and retries can consume significant memory.

---

## Recommended Deployment Architecture

```text
                    ┌──────────────┐
                    │    Nginx     │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │ BaseParse API│
                    └──────┬───────┘
                           │
             ┌─────────────┼─────────────┐
             │             │             │
      ┌──────▼──────┐ ┌────▼────┐ ┌──────▼──────┐
      │ PostgreSQL  │ │  Redis  │ │Object Storage│
      └─────────────┘ └────┬────┘ └─────────────┘
                           │
                    ┌──────▼───────┐
                    │ Parsing Worker│
                    ├───────────────┤
                    │ PDF Renderer  │
                    │ Gemini Client │
                    │ JSON Validator│
                    │ Result Merger │
                    └───────────────┘
```

---

## Asynchronous Job Processing

PDF processing should not run inside the upload HTTP request.

The upload endpoint should immediately create a job and return:

```json
{
  "job_id": "job_8f2d91",
  "status": "queued",
  "status_url": "/api/jobs/job_8f2d91"
}
```

The user can check the status using:

```http
GET /api/jobs/job_8f2d91
```

Processing response:

```json
{
  "job_id": "job_8f2d91",
  "status": "processing",
  "current_page": 8,
  "total_pages": 19,
  "progress": 42
}
```

Completed response:

```json
{
  "job_id": "job_8f2d91",
  "status": "completed",
  "result_url": "/api/results/job_8f2d91"
}
```

---

## Memory-Safe Page Processing

Do not render every page and store all page images in memory.

### Avoid

```text
Render all 200 pages
→ Keep all images in memory
→ Send all pages to Gemini
```

### Recommended

```text
Render pages 1-2
→ Process
→ Save result
→ Delete temporary images
→ Render pages 3-4
```

Page images should be written to temporary storage rather than kept in RAM.

Example directory:

```text
/tmp/baseparse/{job_id}/{page_number}.webp
```

Always delete temporary files after processing:

```text
try:
    process_page()
finally:
    delete_temp_image()
```

---

## Gemini Structured Output

Do not only instruct Gemini to return JSON through prompt text.

Use a strict structured-output schema with fixed block types and coordinate structures.

Recommended block types:

```text
title
heading
paragraph
list
table
figure
formula
header
footer
key_value
```

Example simplified schema:

```json
{
  "type": "object",
  "properties": {
    "page_number": {
      "type": "integer"
    },
    "width": {
      "type": "integer"
    },
    "height": {
      "type": "integer"
    },
    "blocks": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "type": {
            "type": "string",
            "enum": [
              "title",
              "heading",
              "paragraph",
              "list",
              "table",
              "figure",
              "formula",
              "header",
              "footer",
              "key_value"
            ]
          },
          "text": {
            "type": "string"
          },
          "bbox": {
            "type": "object",
            "properties": {
              "x1": {
                "type": "number"
              },
              "y1": {
                "type": "number"
              },
              "x2": {
                "type": "number"
              },
              "y2": {
                "type": "number"
              }
            },
            "required": [
              "x1",
              "y1",
              "x2",
              "y2"
            ]
          },
          "confidence": {
            "type": "number"
          }
        },
        "required": [
          "id",
          "type",
          "text",
          "bbox"
        ]
      }
    }
  },
  "required": [
    "page_number",
    "width",
    "height",
    "blocks"
  ]
}
```

---

## Server-Side Validation

Every Gemini response must be validated before it is added to the final document.

Validation checks should include:

```text
Is the response valid JSON?
Is the response schema valid?
Does the returned page number match?
Are all required fields present?
Are block types allowed?
Are coordinates valid?
Are coordinates inside page dimensions?
Is the output truncated?
Are markdown code fences present?
Does the response contain an SDK error?
Is the page unexpectedly empty?
```

Reject malformed output and retry the page.

---

## Bounding Box Standardization

Use one bounding-box format across every page.

Recommended format:

```json
{
  "bbox": {
    "x1": 128,
    "y1": 375,
    "x2": 646,
    "y2": 142
  }
}
```

Alternatively:

```json
{
  "bbox": [128, 375, 646, 142]
}
```

The object format is easier for API consumers to understand.

Document the coordinate system:

```json
{
  "coordinate_system": {
    "origin": "top-left",
    "unit": "pixels",
    "width": 1000,
    "height": 1414
  }
}
```

Normalized coordinates can also be returned:

```json
{
  "bbox_normalized": {
    "x": 0.128,
    "y": 0.265,
    "width": 0.518,
    "height": 0.102
  }
}
```

---

## Page-Level Retry Strategy

Pages must be retried individually rather than restarting the complete document.

Recommended retry flow:

```text
Attempt 1
Normal image and standard prompt

Attempt 2
Re-encode or reduce image resolution

Attempt 3
Use a page-type-specific prompt or stronger fallback model

Still failing
Mark page as failed
```

Failed page response:

```json
{
  "page": 5,
  "status": "failed",
  "retry_count": 3,
  "error": {
    "code": "PAGE_EXTRACTION_FAILED",
    "message": "The page could not be processed.",
    "retryable": true
  },
  "blocks": []
}
```

Never expose internal SDK exceptions as extracted document text.

---

## Page Routing Strategy

Different pages may require different processing routes.

### Simple Text Page

```text
Gemini 3.1 Flash-Lite
→ Validate
→ Save
```

### Table-Heavy Page

```text
Gemini extraction
→ Table-schema validation
→ Retry with table-specific instructions
```

### Formula-Heavy Page

```text
Gemini Flash-Lite first
→ Check formula quality
→ Use stronger fallback only when required
```

### Low-Quality Scan

```text
Deskew
→ Denoise
→ Improve contrast
→ Render at higher DPI
→ Send to Gemini
```

### Image-Heavy Page

```text
Detect figures
→ Extract figure regions
→ Store figure assets
→ Link assets in JSON
```

This routing approach reduces costs because stronger processing is used only when required.

---

## Structured Table Output

Avoid returning only flattened table text.

Recommended table format:

```json
{
  "id": "page_001_table_002",
  "type": "table",
  "text": "Hemoglobin 14.5 g/dL 13.0 - 16.5",
  "bbox": {
    "x1": 85,
    "y1": 297,
    "x2": 767,
    "y2": 444
  },
  "table": {
    "columns": [
      "Test",
      "Result",
      "Unit",
      "Biological Reference Interval"
    ],
    "rows": [
      {
        "cells": [
          {
            "text": "Hemoglobin"
          },
          {
            "text": "14.5"
          },
          {
            "text": "g/dL"
          },
          {
            "text": "13.0 - 16.5"
          }
        ]
      }
    ],
    "markdown": "| Test | Result | Unit | Reference |",
    "html": "<table></table>"
  }
}
```

Retain flattened text for search and RAG while also returning rows and cells.

---

## Recommended Final Hybrid JSON

```json
{
  "schema_version": "1.0",
  "job": {
    "id": "job_123",
    "status": "completed",
    "created_at": "2026-07-30T08:00:00Z",
    "completed_at": "2026-07-30T08:02:15Z"
  },
  "document": {
    "id": "doc_123",
    "filename": "medical-report.pdf",
    "page_count": 19,
    "document_type": "medical_report",
    "languages": [
      "en"
    ],
    "processing_time_ms": 135000
  },
  "pages": [
    {
      "page_number": 1,
      "status": "completed",
      "dimensions": {
        "width": 1000,
        "height": 1414
      },
      "blocks": [
        {
          "id": "page_001_table_001",
          "type": "table",
          "bbox": {
            "x1": 152,
            "y1": 70,
            "x2": 977,
            "y2": 263
          },
          "text": "Patient Information...",
          "confidence": 0.96,
          "asset": {
            "status": "available",
            "url": "signed-url",
            "mime_type": "image/png"
          }
        }
      ]
    }
  ],
  "warnings": [
    {
      "page": 5,
      "code": "PAGE_RETRIED"
    }
  ],
  "usage": {
    "pages_processed": 19,
    "pages_retried": 1,
    "input_tokens": 0,
    "output_tokens": 0,
    "processing_seconds": 135
  }
}
```

---

## Security Requirements

BaseParse may process research papers, medical documents, examination papers, and confidential files.

Security must cover the complete processing lifecycle.

### Upload Security

- Use HTTPS only.
- Require authenticated upload requests.
- Validate MIME type.
- Validate PDF magic bytes.
- Set maximum file-size limits.
- Set maximum page-count limits.
- Reject malformed PDFs.
- Handle password-protected PDFs explicitly.
- Scan uploads for malicious content when possible.
- Generate internal document IDs instead of trusting filenames.

### Temporary File Security

- Store temporary page images outside the public web directory.
- Use per-job directories.
- Restrict file permissions.
- Delete temporary files after each page finishes.
- Add scheduled cleanup for abandoned jobs.

### Storage Security

Use private object-storage buckets for:

- Original PDFs
- Extracted images
- Table crops
- Generated JSON
- Result archives

Use short-lived signed URLs rather than permanent public URLs.

### API-Key Security

Store Gemini credentials only on the backend:

```env
GEMINI_API_KEY=your-key
```

Never include the Gemini key in:

- Frontend JavaScript
- Flutter applications
- Public repositories
- Client-side environment files
- Application logs
- API responses

Use separate keys for:

```text
Development
Testing
Production
```

### Database Security

Store metadata such as:

```text
document_id
owner_id
job_status
storage_key
processing_metrics
retention_expiry
created_at
completed_at
```

Avoid storing full PDF contents or extracted medical data in logs.

---

## Privacy Requirements

Users must be informed that uploaded document pages are processed through an external AI provider.

The privacy policy should explain:

- What data is uploaded
- Why the data is processed
- That document pages may be sent to Gemini
- How long PDFs are retained
- How long extracted assets are retained
- How users can delete their documents
- Whether data is used for model improvement under the selected provider terms
- Where document data may be processed
- Whether confidential medical documents are supported
- Whether human review is ever performed

For highly confidential or regulated use cases, evaluate whether Vertex AI or another enterprise deployment model is more appropriate.

---

## Rate Limits and Abuse Protection

Recommended initial limits:

### Free Plan

```text
Maximum file size: 25 MB
Maximum pages per document: 50
Active jobs per user: 1
Queued jobs per user: 3
Daily page limit: 25
```

### Paid Plan

```text
Maximum file size: 100 MB
Maximum pages per document: 300
Active jobs per user: 2
Queued jobs per user: 10
Monthly page allowance: plan-based
```

API rate limits:

```text
Upload endpoint: 5 requests per minute
Job-status endpoint: 60 requests per minute
Result endpoint: 30 requests per minute
```

---

## Monitoring

Track the following metrics:

- CPU usage
- Memory usage
- Disk usage
- Disk I/O
- CPU steal time
- Active document jobs
- Queue length
- Page-processing duration
- Document-processing duration
- Failed pages
- Retried pages
- Gemini API latency
- Gemini API errors
- Input tokens
- Output tokens
- Cost per page
- Temporary-storage usage
- Object-storage usage

Recommended tools:

```text
Sentry
Uptime Kuma
Prometheus
Grafana
Redis queue dashboard
Docker logs
```

---

## Usage and Cost Tracking

The main variable cost is Gemini usage rather than the VPS.

Approximate cost model:

```text
Gemini image input
+ Gemini output tokens
+ object storage
+ storage bandwidth
+ VPS cost
```

Track usage for every document:

```json
{
  "page_count": 19,
  "successful_pages": 18,
  "failed_pages": 1,
  "retried_pages": 1,
  "input_tokens": 0,
  "output_tokens": 0,
  "gemini_cost": 0,
  "processing_seconds": 0,
  "peak_memory_mb": 0
}
```

Pricing should be based primarily on pages rather than only documents.

Example:

```text
Free: 25 pages per month
Starter: 500 pages per month
Professional: 5,000 pages per month
Additional usage: charged per 1,000 pages
```

A document may contain three pages or hundreds of pages, so document-count pricing alone is risky.

---

## Backup Strategy

Keep backups outside the VPS provider.

Minimum recommended strategy:

```text
Daily PostgreSQL backup
Daily application-configuration backup
Private object-storage versioning
Weekly offsite backup
Scheduled restore testing
```

Do not depend only on VPS snapshots.

---

## Scaling Plan

### Stage 1: MVP

```text
One VPS
6 vCPU
8 GB RAM
Nginx
API
PostgreSQL
Redis
One parsing worker
Two concurrent page requests
```

### Stage 2: Increased Traffic

```text
Increase RAM to 16 GB
Add more parsing-worker concurrency
Separate API and worker containers
```

### Stage 3: Separate Worker Server

```text
Server 1:
Nginx
API
PostgreSQL
Redis

Server 2:
PDF rendering
Gemini requests
Page validation
Result merging
```

This is likely the most useful first scaling step.

### Stage 4: Multiple Workers

```text
API Servers
     |
Redis Queue
     |
Worker 1
Worker 2
Worker 3
```

Workers can be added without changing the public API.

---

## Production Priorities

Before launching BaseParse publicly, prioritize the following:

1. Use strict Gemini structured output.
2. Standardize bounding-box formats.
3. Standardize block-type enums.
4. Add server-side schema validation.
5. Add page-level retry handling.
6. Prevent internal SDK errors from appearing in output.
7. Use private object storage.
8. Replace permanent URLs with signed URLs.
9. Process pages in small batches.
10. Track token and page costs.
11. Add queue and plan-based rate limits.
12. Add document-retention and deletion controls.
13. Return structured table rows and cells.
14. Add monitoring and offsite backups.

---

## Conclusion

The current page-image-to-Gemini approach is technically suitable for BaseParse.

The existing 6-vCPU, 8-GB VPS can support an MVP because Gemini performs the heavy multimodal inference externally. The most important engineering requirements are controlled concurrency, reliable page retries, strict JSON schemas, private storage, security controls, and detailed usage tracking.

A more expensive VPS is not immediately required. Scaling should be based on real measurements such as:

```text
Average pages per document
Average page-processing time
Average document-processing time
Peak worker memory
Queue length
Failed-page percentage
Gemini cost per page
```
