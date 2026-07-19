from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from redis import Redis
from rq import Queue
import os

app = FastAPI(title="GenWorkAI Knowledge Ingestion API")

# Setup Redis connection and RQ queue
redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
redis_conn = Redis.from_url(redis_url)
task_queue = Queue("default", connection=redis_conn)

class IngestRequest(BaseModel):
    document_id: int
    storage_key: str
    mime_type: str

from src.worker.tasks import process_document
from src.api.extract import router as extract_router

app.include_router(extract_router, prefix="/api/v1", tags=["extract"])

@app.post("/api/v1/ingest")
async def ingest_document(req: IngestRequest):
    # Pass the job to RQ with a 1-hour timeout for long PDFs
    job = task_queue.enqueue(
        process_document,
        req.document_id,
        req.storage_key,
        req.mime_type,
        job_timeout=3600
    )
    
    return {
        "job_id": job.id,
        "status": "queued",
        "message": "Document ingestion job created"
    }

@app.get("/api/v1/jobs/{job_id}")
async def get_job_status(job_id: str):
    job = task_queue.fetch_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    return {
        "job_id": job.id,
        "status": job.get_status(),
        "result": job.result
    }

@app.get("/health")
async def health_check():
    return {"status": "ok"}
