# Local Development Startup Guide

To get the full GenWorkAI platform running locally (including the V3 Multimodal Knowledge Pipeline), you need to run **three** separate services. 

Open three separate terminal windows in your IDE and run the following commands in each:

### Terminal 1: The Main Web App (Next.js)
This starts the frontend, the core API routes, and the developer extension.
```powershell
# From the root of the project
npm run dev
```
- **Runs on**: `http://localhost:3000`

### Terminal 2: The Background Job Orchestrator (Inngest)
This starts the local Inngest server which handles all asynchronous tasks, cron jobs, and queues (like the document extraction pipeline).
```powershell
# From the root of the project
npx inngest-cli@latest dev
```
- **Runs on**: `http://localhost:8288`
- *Note: If Next.js throws `fetch failed` errors on `/api/inngest`, it means this server isn't running!*

### Terminal 3: The AI Extraction Service (Python FastAPI)
This starts the Python backend worker that handles the heavy lifting for PDF parsing, image OCR, and knowledge graph embeddings.
```powershell
# 1. Navigate to the python worker directory
cd apps/python-worker

# 2. Activate your virtual environment (if you have one)
# .venv\Scripts\activate

# 3. Install dependencies (only needed once)
# pip install -r requirements.txt

# 4. Start the FastAPI server
uvicorn main:app --reload --port 8000
```
- **Runs on**: `http://localhost:8000`
- *Note: If Inngest shows a "Python worker failed: fetch failed" error in its dashboard when processing a document, it means this service isn't running!*

---

### Troubleshooting
- **Database/Supabase**: Ensure your `.env.local` inside `apps/web` has a valid `DATABASE_URL` pointing to your local or remote Postgres instance.
- **Port Conflicts**: Make sure ports `3000`, `8288`, and `8000` are free before starting the services.
