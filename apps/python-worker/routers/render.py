import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

try:
    from pdf2image import convert_from_path
    PDF2IMAGE_AVAILABLE = True
except ImportError:
    PDF2IMAGE_AVAILABLE = False

router = APIRouter()

class RenderRequest(BaseModel):
    storageKey: str
    mimeType: str

@router.post("/render")
def render_document(req: RenderRequest):
    file_path = os.path.join("../../apps/web/public/uploads", req.storageKey)
    
    if PDF2IMAGE_AVAILABLE and os.path.exists(file_path) and req.mimeType == "application/pdf":
        try:
            images = convert_from_path(file_path, dpi=150)
            pages = []
            for i, img in enumerate(images):
                # In a real app, save image to R2 and return the URL
                pages.append({"page": i + 1, "status": "rendered", "width": img.width, "height": img.height})
            return {"status": "success", "pages": pages}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    else:
        return {"status": "success", "message": "Mock render", "pages": [{"page": 1, "status": "rendered", "width": 800, "height": 1000}]}
