import os
import tempfile
import time
import requests
import base64
from io import BytesIO
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from pdf2image import convert_from_path
import pypdf

try:
    from google import genai
    from google.genai import types
except ImportError:
    pass

router = APIRouter()

TEMP_ASSETS_DIR = "temp_assets"
os.makedirs(TEMP_ASSETS_DIR, exist_ok=True)

class ElementStyle(BaseModel):
    font_size: Optional[int] = None
    weight: Optional[str] = None
    alignment: Optional[str] = None

class TableCell(BaseModel):
    row: int
    column: int
    text: str

class DocumentElement(BaseModel):
    id: str = Field(description="Unique identifier for this element, e.g., 'elem_001'")
    type: Literal["heading", "paragraph", "table", "image", "formula", "list", "header", "footer", "page_number", "caption", "signature", "qr_code", "barcode", "divider"]
    bbox: List[int] = Field(description="[x1, y1, x2, y2] coordinates in pixels")
    reading_order: int = Field(description="The logical reading order of this element starting from 1")
    confidence: float = Field(description="Confidence score between 0.0 and 1.0. Must be accurate.")
    text: Optional[str] = Field(None, description="Text content for text-based elements")
    style: Optional[ElementStyle] = None
    rows: Optional[int] = Field(None, description="Number of rows if this is a table")
    columns: Optional[int] = Field(None, description="Number of columns if this is a table")
    cells: Optional[List[TableCell]] = Field(None, description="Cell data if this is a table")
    latex: Optional[str] = Field(None, description="LaTeX string if this is a formula")

class DocumentPage(BaseModel):
    page_number: int
    width: int
    height: int
    original_width: Optional[float] = Field(None, description="Original width in PDF points")
    original_height: Optional[float] = Field(None, description="Original height in PDF points")
    rotation: int = 0
    dpi: int = Field(description="The DPI the page was rasterized at")
    elements: List[DocumentElement]

def cleanup_old_assets():
    """Delete assets older than 24 hours"""
    now = time.time()
    for root, dirs, files in os.walk(TEMP_ASSETS_DIR):
        for f in files:
            path = os.path.join(root, f)
            if os.stat(path).st_mtime < now - (24 * 3600):
                try:
                    os.remove(path)
                except:
                    pass

def process_layout_webhook(file_path: str, job_id: str, webhook_url: str, document_type: str, extract_options: str):
    start_time = time.time()
    try:
        if not os.environ.get("GEMINI_API_KEY"):
            raise Exception("GEMINI_API_KEY is not set.")
            
        client = genai.Client()
        
        # Adaptive DPI logic
        dpi = 300
        doc_type_lower = document_type.lower()
        if doc_type_lower == "receipt":
            dpi = 200
        elif doc_type_lower in ["invoice", "book"]:
            dpi = 250
        elif doc_type_lower == "engineering":
            dpi = 400
            
        print(f"[{job_id}] Rasterizing PDF at {dpi} DPI...")
        images = convert_from_path(file_path, dpi=dpi)
        
        # Extract original dimensions using pypdf
        original_dimensions = []
        try:
            reader = pypdf.PdfReader(file_path)
            for page in reader.pages:
                box = page.mediabox
                original_dimensions.append({
                    "width": float(box.width),
                    "height": float(box.height)
                })
        except Exception as e:
            print(f"[{job_id}] Warning: Could not extract original dimensions: {e}")
            original_dimensions = [{"width": None, "height": None}] * len(images)
        
        all_pages = []
        all_assets = []
        total_input_tokens = 0
        total_output_tokens = 0
        pages_failed = 0
        
        prompt = """Analyze this document page and extract all structural elements according to the provided schema. 
Pay close attention to bounding boxes [x1, y1, x2, y2] in pixels.
For tables, do not just return the text, extract every cell.
For formulas, provide the LaTeX representation.
For images, provide the bounding box so we can crop it.
CRITICAL: Ensure reading_order is perfectly sequential and logical.
CRITICAL: Provide realistic confidence scores between 0.0 and 1.0.
"""
        if extract_options:
            prompt += f"\nCRITICAL: You must ONLY extract elements of the following types: {extract_options}. Ignore all other content.\n"
        
        job_asset_dir = os.path.join(TEMP_ASSETS_DIR, job_id)
        os.makedirs(job_asset_dir, exist_ok=True)
        
        # 2. Process each page with Retries
        for i, img in enumerate(images):
            page_num = i + 1
            orig_dim = original_dimensions[i] if i < len(original_dimensions) else {"width": None, "height": None}
            print(f"[{job_id}] Processing page {page_num}/{len(images)}...")
            
            page_data = None
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    response = client.models.generate_content(
                        model='gemini-3.1-flash-lite',
                        contents=[img, prompt],
                        config=types.GenerateContentConfig(
                            response_mime_type="application/json",
                            response_schema=DocumentPage,
                            temperature=0.1
                        )
                    )
                    page_data = response.parsed
                    if not page_data:
                        page_data = DocumentPage.model_validate_json(response.text)
                    
                    if response.usage_metadata:
                        total_input_tokens += getattr(response.usage_metadata, 'prompt_token_count', 0)
                        total_output_tokens += getattr(response.usage_metadata, 'candidates_token_count', 0)
                    break
                except Exception as e:
                    if attempt == max_retries - 1:
                        print(f"[{job_id}] Page {page_num} failed after {max_retries} attempts: {e}")
                        pages_failed += 1
                    else:
                        time.sleep(2 ** attempt) # Exponential backoff
            
            if not page_data:
                continue
            
            # Ensure width/height/dpi/original dimensions are correct
            page_data.width = img.width
            page_data.height = img.height
            page_data.original_width = orig_dim["width"]
            page_data.original_height = orig_dim["height"]
            page_data.page_number = page_num
            page_data.dpi = dpi
            
            # 3. Deterministic IDs and Process Assets
            for idx, elem in enumerate(page_data.elements):
                # Deterministic ID assignment
                deterministic_id = f"{elem.type}_p{page_num}_{idx+1:03d}"
                elem.id = deterministic_id
                
                if elem.type == "image" and elem.bbox and len(elem.bbox) == 4:
                    try:
                        # Crop the image
                        x1, y1, x2, y2 = elem.bbox
                        x1 = max(0, x1)
                        y1 = max(0, y1)
                        x2 = min(img.width, x2)
                        y2 = min(img.height, y2)
                        
                        cropped = img.crop((x1, y1, x2, y2))
                        
                        asset_id = f"asset_{job_id}_p{page_num}_{elem.id}"
                        filename = f"{asset_id}.jpg"
                        filepath = os.path.join(job_asset_dir, filename)
                        
                        cropped.save(filepath, format="JPEG", quality=85)
                        
                        # The URL will be proxied by Next.js
                        asset_url = f"/api/v1/assets/{job_id}/{filename}"
                        
                        # Asset expiration timestamp
                        expires_at = (datetime.utcnow() + timedelta(hours=24)).isoformat() + "Z"
                        
                        # Store in assets array
                        all_assets.append({
                            "id": asset_id,
                            "type": "image",
                            "mime": "image/jpeg",
                            "url": asset_url,
                            "expires_at": expires_at
                        })
                        
                    except Exception as e:
                        print(f"Failed to extract image asset: {e}")
            
            all_pages.append(page_data.model_dump())

        processing_time_ms = int((time.time() - start_time) * 1000)
        
        # 4. Construct Final DOM Response with Semantic Versioning and Meta
        payload = {
            "job_id": job_id,
            "schema_version": "1.0.0",
            "extracted_data": {
                "pages": all_pages,
                "assets": all_assets,
                "document": {"pages": len(images)},
                "usage": {
                    "input_tokens": total_input_tokens, 
                    "output_tokens": total_output_tokens
                },
                "metadata": {
                    "model": "gemini-3.1-flash-lite"
                }
            },
            "processing_time_ms": processing_time_ms,
            "status": "completed_with_errors" if pages_failed > 0 else "completed",
            "pages_processed": len(images) - pages_failed,
            "pages_failed": pages_failed
        }
        
        requests.post(webhook_url, json=payload)
        
    except Exception as e:
        print(f"[{job_id}] Layout Error: {e}")
        error_payload = {
            "job_id": job_id,
            "extracted_data": {"error": str(e)},
            "processing_time_ms": int((time.time() - start_time) * 1000),
            "status": "error"
        }
        requests.post(webhook_url, json=error_payload)
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)
        cleanup_old_assets()

@router.post("/layout")
async def extract_layout(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    job_id: str = Form(...),
    webhook_url: str = Form(...),
    priority: str = Form("default"),
    document_type: str = Form("default"),
    extract: str = Form("")
):
    fd, temp_path = tempfile.mkstemp(suffix=".pdf")
    os.close(fd)
    
    with open(temp_path, "wb") as buffer:
        buffer.write(await file.read())
        
    background_tasks.add_task(process_layout_webhook, temp_path, job_id, webhook_url, document_type, extract)
    
    return {"status": "processing", "job_id": job_id}

@router.get("/assets/{job_id}/{asset_filename}")
async def get_asset(job_id: str, asset_filename: str):
    """Serve cropped assets locally so the Next.js API can proxy them"""
    path = os.path.join(TEMP_ASSETS_DIR, job_id, asset_filename)
    if os.path.exists(path) and ".." not in asset_filename: # basic path traversal prevention
        return FileResponse(path)
    raise HTTPException(status_code=404, detail="Asset not found")
