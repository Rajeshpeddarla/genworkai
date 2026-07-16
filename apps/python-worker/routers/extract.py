import os
import tempfile
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

try:
    from docling.document_converter import DocumentConverter
    DOCLING_AVAILABLE = True
except ImportError:
    DOCLING_AVAILABLE = False

router = APIRouter()

class ExtractRequest(BaseModel):
    storageKey: str
    mimeType: str

@router.post("/extract")
def extract_document(req: ExtractRequest):
    # In production, we fetch the file from `public/uploads/{req.storageKey}`
    # For now, we simulate the extraction if docling is not installed or file is missing.
    
    file_path = os.path.join("../../apps/web/public/uploads", req.storageKey)
    
    if DOCLING_AVAILABLE and os.path.exists(file_path):
        try:
            converter = DocumentConverter()
            result = converter.convert(file_path)
            md_text = result.document.export_to_markdown()
            return {"status": "success", "text": md_text}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    else:
        # Fallback / Mock
        return {
            "status": "success", 
            "message": "Mock extraction (Docling not available or file not found)", 
            "text": f"# Mock Document\n\nContent for {req.storageKey}"
        }
