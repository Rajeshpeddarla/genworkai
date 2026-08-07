# BaseParse Local Development Guide

Welcome to the **BaseParse** (genworkai) project! This application relies on a modern serverless stack utilizing Next.js, Supabase, Modal (GPU Worker), and Webhooks.

Because this stack relies heavily on async processing and webhooks to bypass HTTP timeouts, running the app locally requires a few moving parts. Here is exactly what you need to run to get a full local environment working.

---

## 1. Start the Next.js App
The core application containing the Dashboard and REST API.

**Terminal 1:**
\`\`\`bash
cd apps/pipeline
npm install
npm run dev
\`\`\`
This runs the main app on \`http://localhost:3000\`.

## 2. Expose Localhost to the Internet (ngrok)
Because the heavy GPU parsing happens on Modal's cloud infrastructure (or local Docker), it needs a way to send the final JSON payload back to your local Next.js server. 

**Terminal 2:**
\`\`\`bash
ngrok http 3000
\`\`\`
> [!IMPORTANT]
> Copy the \`https://<your-ngrok-url>.ngrok-free.dev\` URL and add it to your \`apps/pipeline/.env.local\` file as \`PUBLIC_DEV_URL=https://<your-ngrok-url>.ngrok-free.dev\`. You only need to do this when your ngrok URL changes.

## 3. Start the GPU Worker (Python)
There are two ways to run the Python worker. We highly recommend using Modal for local development because it accurately mimics production and gives you instant access to cloud GPUs.

### Option A: Using Modal (Recommended)
This syncs your local python files to Modal's cloud instantly, running the API there while sending webhooks back to your ngrok URL.

**Terminal 3:**
\`\`\`bash
cd apps/python-worker
modal serve modal_app.py
\`\`\`
> [!NOTE]
> Make sure your \`apps/pipeline/.env.local\` has \`MODAL_WORKER_URL\` set to your Modal dev workspace URL (e.g. \`https://your-username--genworkai-extract-fastapi-app-dev.modal.run/api/worker\`).

### Option B: Using Local Docker
If you want to run the python worker entirely on your local machine (without cloud GPUs), you can use the docker-compose file.

**Terminal 3:**
\`\`\`bash
docker-compose up
\`\`\`
This will spin up the FastAPI python worker on \`http://localhost:8000\` (along with Redis). If doing this, comment out \`MODAL_WORKER_URL\` in your \`.env.local\`.

---

## Environment Variables Summary (\`apps/pipeline/.env.local\`)

Make sure you have these key variables set before starting:

\`\`\`bash
# Supabase Database (Must use port 6543 for PgBouncer pooling)
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
DATABASE_URL=postgresql://postgres.<your-project>:<password>@aws-0-eu-central-1.pooler.supabase.com:6543/postgres

# AI Keys
GEMINI_API_KEY=...
DEEPSEEK_API_KEY=...

# Python Worker Connection
# Comment this out if using local docker-compose
MODAL_WORKER_URL=https://your-username--genworkai-extract-fastapi-app-dev.modal.run/api/worker

# Your ngrok URL so Modal can talk to your localhost
PUBLIC_DEV_URL=https://<your-ngrok-url>.ngrok-free.dev
\`\`\`

## Architecture Flow (For debugging)
1. You upload a PDF via \`POST /v1/layout\`.
2. Next.js creates a \`job_id\` in Supabase.
3. Next.js forwards the PDF and your \`PUBLIC_DEV_URL\` webhook to the \`MODAL_WORKER_URL\`.
4. Next.js immediately responds to the user with \`{"status": "queued"}\`.
5. Modal processes the PDF (takes 10s - 2m).
6. Modal sends an HTTP POST back to \`PUBLIC_DEV_URL/api/v1/webhooks/layout\` with the massive JSON payload.
7. Next.js saves the final JSON to Supabase.
