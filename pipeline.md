# BaseParse Pipeline Architecture

BaseParse (GenWorkAI) is an advanced document processing and retrieval-augmented generation (RAG) platform. It provides a suite of APIs for developers to upload documents, extract structured and unstructured text, generate embeddings, and perform AI-driven semantic searches.

This document serves as the absolute source of truth for the architecture, designed specifically to help AI models and developers understand how the pipeline operates, from edge API routing to background Python processing and database interactions.

---

## 1. System Components & Technologies

- **Frontend/API Gateway:** Next.js 15 (App Router). Handles user authentication (Supabase), billing checks, rate limiting, and API routing.
- **Database:** PostgreSQL (with `pgvector` extension enabled).
- **Asynchronous Workers:** Python backend using Redis and `RQ` (Redis Queue) to process long-running document extractions in the background.
- **AI Models:** Google Gemini (`gemini-3.1-flash-lite`, `gemini-1.5-pro` for structured extraction, and `text-embedding-004` for vectors).

---

## 2. API Endpoints Overview

All API endpoints live under `/api/v1/` in the Next.js `apps/pipeline` directory.

### 2.1 Extraction & Processing Endpoints

#### `POST /v1/ocr` (Fast Raw Extraction)
- **Purpose:** Instantly extracts flat, raw text from a document.
- **Architecture:** Synchronous. It receives a `multipart/form-data` PDF, verifies the API key, checks the user's billing quota (`baseparse_user_plans.pages_extracted_this_month`), and sends the PDF directly to `gemini-3.1-flash-lite`. 
- **Output:** Returns a flat JSON object: `{ "text": "extracted document text..." }`. No bounding boxes or table structures are returned.

#### `POST /v1/parse` (High-Accuracy Asynchronous Extraction)
- **Purpose:** Processes heavy, complex documents asynchronously utilizing the Python worker backend. 
- **Architecture:** Polling-based asynchronous workflow. 
  1. The Next.js API receives the file and computes a SHA-256 hash.
  2. It inserts a new row into `baseparse_documents` with `status = 'processing'`.
  3. It dispatches a `POST` request to the internal Python backend (`http://localhost:8000/api/v1/extract`), passing the file, `job_id`, a webhook URL, and a `priority` flag (high for Pro/Enterprise, default for Free).
  4. The Next.js API then enters a `while` loop, polling the database every 3 seconds (up to 5 minutes) waiting for the `status` to change to `completed`.
  5. Once completed, it returns the rich Markdown/JSON output.

#### `POST /v1/webhooks/extract` (Internal Webhook)
- **Purpose:** Used strictly by the internal Python RQ workers to notify the Next.js backend that an asynchronous job has finished.
- **Architecture:** Receives the processed payload, calculates the real page count, deducts the pages from the user's billing quota, updates the `baseparse_documents` row to `status = 'completed'`, and writes a success record to `request_logs`.

#### `GET /v1/jobs/[id]`
- **Purpose:** Allows developers to programmatically fetch the current status of an asynchronous extraction job.
- **Output:** Returns `{ "job_id": "...", "status": "completed|processing|error", "data": {...} }`.

### 2.2 Extraction Engine Details (How it actually parses PDFs)

When a PDF is uploaded, depending on the endpoint used, the extraction happens differently:

**1. Fast Extraction (`/v1/ocr`)**
- The Next.js API receives the PDF file and converts it into a Base64 string.
- It leverages **Google Gemini 3.1 Flash Lite** directly using the `@google/genai` SDK.
- The prompt strictly asks the AI to: `"Extract all the text from this document as plain text. Do not output JSON. Do not output markdown. Just the raw text."`
- The result is a single flat string.

**2. Asynchronous Extraction (`/v1/parse`)**
- The Next.js API sends the raw PDF file to the Python Worker (`/v1/extract`).
- The Python worker utilizes **IBM Docling** (`docling.document_converter`).
- Docling uses specialized, local Layout Analysis models (like LayoutLM) to physically read the PDF, identify tables, headings, and images, and convert the entire layout into Markdown format (`export_to_markdown()`).
- The Python backend then wraps this Markdown into a structured JSON envelope and sends it back to the Next.js webhook.

---

## 3. Intelligence API Pipeline (Premium Layout Extraction)

The **Intelligence API** is a premium endpoint designed to not just read text, but to visually understand the physical layout of the document. This is required for applications that need to reconstruct the PDF visually (e.g., allowing users to click and edit a table directly on a PDF preview). 

Here is the exact end-to-end operational pipeline for how this works without any gaps:

### Step 1: Ingestion & Validation
1. The user sends a `POST` request to the Intelligence API endpoint containing a `multipart/form-data` PDF file.
2. The Next.js API Gateway authenticates the request using the `Authorization: Bearer` token.
3. The gateway queries `baseparse_user_plans` to verify the user is on a **Pro or Enterprise** tier. If they are on a Free tier, the request is immediately rejected.
4. The system validates the file format and size limits.

### Step 2: Preprocessing & Rasterization
1. Because standard OCR fails on complex layouts, the PDF is fundamentally treated as a visual image.
2. The pipeline splits the multi-page PDF into individual pages.
3. Each page is rasterized (converted into a high-resolution PNG/JPEG image) at 300+ DPI. This preserves all visual context: table borders, image placements, typography, and charts.

### Step 3: AI Vision Extraction (Multimodal Analysis)
1. The rasterized image of a page is sent to a cutting-edge multimodal Vision AI model (e.g., **Gemini 1.5 Pro** or specialized Layout AI).
2. The API request to the AI model enforces a strict **JSON Schema** (`responseSchema`) so the model cannot hallucinate markdown or plain text. 
3. The prompt explicitly instructs the AI to map the visual layout, extract the text/data, and return precise **bounding box coordinates** (`[ymin, xmin, ymax, xmax]`) for every logical element on the page.

### Step 4: Structured Data Assembly
The AI processes the image and identifies boundaries. For example:
- It detects a photograph on the page, categorizes it as `"type": "image"`, and calculates its exact physical boundary coordinates.
- It detects a table, categorizes it as `"type": "table"`, calculates the table's overall bounding box, and structures the inner data into a 2D array of rows and cells.
- It detects text blocks and categorizes them as headings or paragraphs with their respective coordinates.

### Step 5: JSON Response Generation
1. The pipeline aggregates the extracted page layouts into a master JSON document.
2. The webhook (or synchronous response) logs the success in `request_logs` and deducts the processed pages from the user's billing quota.
3. The final JSON payload is returned to the user.

**Example Extracted Output:**
```json
{
  "pages": [
    {
      "page_number": 1,
      "width": 1200,
      "height": 1600,
      "blocks": [
        {
          "type": "image",
          "bbox": [100, 50, 400, 600],
          "description": "Company Logo"
        },
        {
          "type": "table",
          "bbox": [450, 50, 900, 1150],
          "table_data": [
            ["Item", "Cost"],
            ["Server", "$500"]
          ]
        }
      ]
    }
  ]
}
```
*With this highly structured JSON and bounding box data, the developer's frontend can render interactive, editable overlays perfectly positioned over the original PDF.*

---

## 4. RAG (Retrieval-Augmented Generation) Endpoints

#### `POST /v1/chunks` (Semantic Chunking)
- **Purpose:** Splits large text inputs into semantically logical chunks (e.g., separating paragraphs logically rather than arbitrarily cutting them). 
- **Architecture:** Gated feature (Premium users only). Hits Gemini to analyze the text and return an array of logical blocks.

#### `POST /v1/embed` (Vector Embeddings)
- **Purpose:** Converts text chunks into high-dimensional vector embeddings using Google's `text-embedding-004`.
- **Architecture:** 
  1. Generates vectors for an array of input chunks.
  2. **Raw Response:** The API always returns the raw vector float arrays (`embeddings`) in the response so developers can use their own vector databases.
  3. **Optional Storage:** If the developer provides a `documentId` in the payload, the backend will simultaneously `INSERT` the vectors into the internal `baseparse_embeddings` table. This allows the user to immediately utilize the built-in `/v1/search` endpoint without hosting their own database.

#### `POST /v1/search`
- **Purpose:** Performs a cosine similarity search against vectors stored in `baseparse_embeddings`.
- **Architecture:** Requires a user to have previously generated embeddings via `/v1/embed` using a `documentId`. It embeds the user's search query and uses `pgvector` to find the nearest matching chunks.

#### `POST /v1/chat`
- **Purpose:** Provides conversational AI with context from the user's documents.
- **Architecture:** Operates like `/v1/search`, but instead of returning the raw matching chunks, it injects those chunks into a system prompt and asks Gemini to formulate a conversational answer based *only* on the provided context.

---

## 3. Database Schema Highlights

The core of the application relies on the following tables in Postgres:

1. **`baseparse_api_keys`**: Stores user API keys, mapped to a `user_id`. Keys are hashed via SHA-256 (`key_hash`) before storage for security.
2. **`baseparse_user_plans`**: Tracks billing allocations (`pages_extracted_this_month`, `plan_id`).
3. **`baseparse_documents`**: Stores document metadata and the final extraction result. Tracks asynchronous status (`processing`, `completed`, `error`).
4. **`baseparse_embeddings`**: Uses the `pgvector` extension. Stores the `document_id`, raw `content`, `metadata`, and the `embedding` (vector format).
5. **`request_logs`**: Logs every API interaction for usage analytics and debugging.

---

## 4. Asynchronous Queue Mechanics (Redis / RQ)

When a document hits `/v1/parse`, the system handles the heavy load securely:

1. **Gatekeeping**: Next.js checks if the user has enough credits.
2. **Priority Assignment**: Next.js checks the user's plan. If they are `pro` or `enterprise`, they are assigned the `high` queue. Otherwise, they use the `default` queue.
3. **Worker Processing**: The Python API receives the request and places it into Redis. Background workers pick it up and process the PDF using advanced OCR tooling (like Marker).
4. **Webhook Callback**: The worker finishes and sends a POST request to the Next.js `webhook` endpoint.
5. **Resolution**: The Next.js endpoint (which has been polling the database in a `while` loop) detects the change and returns the final HTTP response to the end user.

---

## 5. Billing Mechanics

BaseParse utilizes a usage-based gating mechanism rather than post-pay meters.
- Before any operation runs (e.g., OCR or Parse), the backend queries `baseparse_user_plans`.
- If `pages_extracted_this_month >= page_extraction_limit`, the API instantly rejects the request with a `402 Payment Required` (or `403 Forbidden`).
- If successful, the webhook or synchronous route runs an `UPDATE` statement to increment the `pages_extracted_this_month` counter.

This ensures zero risk of over-provisioning or runaway compute costs.

---

## 6. Premium Intelligence API (`/v1/layout`)

The Premium Layout API extracts documents into a structured **Document Object Model (DOM)** instead of plain text, returning high-fidelity coordinates, tables, images, and reading orders. It is designed specifically for building frontend UI viewers, Canvas renderers, and advanced RAG systems.

### Pipeline Architecture
1. **Adaptive Rasterization**: Documents are dynamically converted to images based on their `document_type` (e.g. `receipt` = 200 DPI, `engineering` = 400 DPI).
2. **Gemini Vision Extraction**: A strictly enforced Pydantic schema is passed to Gemini 1.5 Pro to extract bounding boxes (`bbox`), reading orders, confidence scores, and raw LaTeX for formulas.
3. **Local Asset Proxying**: Gemini detects image elements and returns their coordinates. The Python worker instantly crops these from the rasterized PDF and saves them to a local `temp_assets` folder. A Next.js route (`/v1/assets/[job_id]/[asset_id]`) acts as a secure streaming proxy to deliver these to the client, entirely avoiding S3/blob storage bloat.

### Important Developer Caveats
> [!WARNING]
> - **Not Pixel-Perfect:** Bounding boxes extracted by Vision models are approximate. They are highly accurate for UI reconstruction but should not be used to blindly overwrite or modify binary PDF internals.
> - **Confidence Scores:** Use the returned `confidence` score (0.0 to 1.0) to highlight uncertain extractions for manual human-in-the-loop review.

### Gemini Model Benchmarking
Future model upgrades will be evaluated using the following matrix:

| Model | Speed | Cost | Layout Accuracy | Table Accuracy | Formula Accuracy |
|---|---|---|---|---|---|
| **Gemini 1.5 Pro** | Moderate | High | Excellent | Excellent | Very Good |
| **Gemini 2.5 Pro** | TBD | TBD | TBD | TBD | TBD |
| **Gemini 2.5 Flash** | Fast | Low | Good | Moderate | Moderate |
