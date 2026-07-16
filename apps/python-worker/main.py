from fastapi import FastAPI
from routers import extract, render, chunk, graph, embed

app = FastAPI(title="GenWorkAI Multimodal Worker", version="3.0")

app.include_router(extract.router, prefix="/api/worker")
app.include_router(render.router, prefix="/api/worker")
app.include_router(chunk.router, prefix="/api/worker")
app.include_router(embed.router, prefix="/api/worker")
app.include_router(graph.router, prefix="/api/worker")

@app.get("/health")
def health_check():
    return {"status": "healthy", "version": "3.0"}
