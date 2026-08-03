import os
import tempfile
import time
import requests
import base64
from io import BytesIO
from datetime import datetime, timedelta
from typing import List, Optional, Literal

import modal
from fastapi import Request, Form, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

# 1. Define the Modal Image and Volume
image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install(
        "fastapi",
        "uvicorn",
        "python-multipart",
        "pydantic",
        "requests",
        "docling",
        "torch",
        "torchvision",
        "pdf2image",
        "pillow",
        "pypdf",
        "google-genai"
    )
    .apt_install("libgl1", "libglib2.0-0", "poppler-utils")
)

app = modal.App("genworkai-extract", image=image)
assets_volume = modal.Volume.from_name("genworkai-assets", create_if_missing=True)
TEMP_ASSETS_DIR = "/temp_assets"

# --- Models ---
class ElementStyle(BaseModel):
    font_family: Optional[str] = Field(None, description="Font family name, e.g. Times New Roman")
    font_size: Optional[int] = Field(None, description="Font size in points")
    font_weight: Optional[str] = Field(None, description="bold, normal, light, etc")
    italic: Optional[bool] = Field(None, description="True if text is italicized")
    color: Optional[str] = Field(None, description="Hex color code of text")
    background_color: Optional[str] = Field(None, description="Hex color code of background if highlighted")
    alignment: Optional[str] = Field(None, description="left, center, right, justify")
    line_height: Optional[float] = Field(None, description="Line height spacing factor")

class NormalizedBBox(BaseModel):
    x: float
    y: float
    width: float
    height: float

class TableCell(BaseModel):
    row: int
    column: int
    text: str

class Section(BaseModel):
    title: str
    elements: List[str] = Field(description="List of element IDs in this section")

class DocumentElement(BaseModel):
    id: str = Field(description="Unique identifier for this element")
    parent_id: Optional[str] = Field(None, description="ID of parent element if this belongs to one (e.g. caption belongs to figure)")
    type: Literal["heading", "paragraph", "table", "image", "figure", "formula", "list", "header", "footer", "page_number", "caption", "signature", "qr_code", "barcode", "divider"]
    bbox: List[int] = Field(description="[x1, y1, x2, y2] coordinates in pixels")
    bbox_normalized: Optional[NormalizedBBox] = Field(None, description="Automatically calculated by the system")
    z_index: int = Field(0, description="Z-index layer order for overlapping elements")
    reading_order: int = Field(description="The logical reading order of this element starting from 1")
    column: Optional[int] = Field(None, description="Which column this element is in (1, 2, etc)")
    group: Optional[str] = Field(None, description="Logical group this element belongs to")
    confidence: float = Field(description="Confidence score between 0.0 and 1.0. Must be accurate.")
    text: Optional[str] = Field(None, description="Text content for text-based elements")
    style: Optional[ElementStyle] = None
    # Image/Figure Metadata
    asset_id: Optional[str] = Field(None, description="System asset ID")
    format: Optional[str] = Field(None, description="Image format")
    # Table Metadata
    rows: Optional[int] = Field(None, description="Number of rows if this is a table")
    columns: Optional[int] = Field(None, description="Number of columns if this is a table")
    merged_cells: Optional[List[str]] = Field(None, description="List of merged cell ranges like A1:B2")
    cells: Optional[List[TableCell]] = Field(None, description="Cell data if this is a table")
    # Formula Metadata
    latex: Optional[str] = Field(None, description="LaTeX string if this is a formula")
    formula_display: Optional[bool] = Field(None, description="True if block formula, False if inline")

class DocumentPage(BaseModel):
    page_number: int
    width: int
    height: int
    original_width: Optional[float] = Field(None, description="Original width in PDF points")
    original_height: Optional[float] = Field(None, description="Original height in PDF points")
    rotation: int = 0
    dpi: int = Field(description="The DPI the page was rasterized at")
    page_image_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    sections: Optional[List[Section]] = Field(None, description="List of document sections on this page")
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

# 2. Define the heavy GPU processing functions
@app.function(gpu="T4", timeout=600)
def process_and_webhook(file_data: bytes, file_name: str, job_id: str, webhook_url: str):
    print(f"Starting job {job_id} for {file_name}...")
    start_time = time.time()
    
    fd, temp_path = tempfile.mkstemp(suffix=".pdf")
    os.close(fd)
    with open(temp_path, "wb") as f:
        f.write(file_data)
        
    try:
        from docling.document_converter import DocumentConverter
        
        pages_list = []
        converter = DocumentConverter()
        result = converter.convert(temp_path)
        
        v3_pages = {}
        doc_dict = result.document.export_to_dict()
        for page_num_str, page_info in doc_dict.get("pages", {}).items():
            page_no = int(page_num_str)
            v3_pages[page_no] = {
                "page": page_no,
                "width": page_info.get("size", {}).get("width", 0),
                "height": page_info.get("size", {}).get("height", 0),
                "blocks": []
            }
        
        block_counter = 1
        for item, level in result.document.iterate_items():
            page_no = 1
            bbox = None
            if hasattr(item, "prov") and item.prov:
                page_no = item.prov[0].page_no
                if hasattr(item.prov[0], "bbox"):
                    b = item.prov[0].bbox
                    bbox = [b.l, b.t, b.r, b.b]
            
            if page_no not in v3_pages:
                v3_pages[page_no] = {"page": page_no, "width": 0, "height": 0, "blocks": []}
            
            label = getattr(item, "label", "unspecified")
            block = {
                "id": f"{label}_{block_counter:03d}",
                "type": label,
            }
            
            if hasattr(item, "text") and item.text:
                block["text"] = item.text
            elif hasattr(item, "export_to_markdown"):
                try:
                    block["markdown"] = item.export_to_markdown()
                except Exception:
                    pass
            
            if level:
                block["level"] = level
            if bbox:
                block["bbox"] = bbox
            
            v3_pages[page_no]["blocks"].append(block)
            block_counter += 1
            
        pages_list = [v3_pages[k] for k in sorted(v3_pages.keys())]
        md_text = result.document.export_to_markdown()
        
        processing_time_ms = int((time.time() - start_time) * 1000)
        
        payload = {
            "job_id": job_id,
            "extracted_data": {
                "pages": pages_list,
                "document": {"pages": len(pages_list)},
                "usage": {"input_tokens": len(md_text)//4, "output_tokens": len(md_text)}
            },
            "processing_time_ms": processing_time_ms
        }
        
        print(f"Finished processing job {job_id} in {processing_time_ms}ms. Triggering webhook...")
        headers = {"ngrok-skip-browser-warning": "true", "User-Agent": "baseparse-worker/1.0"}
        resp = requests.post(webhook_url, json=payload, headers=headers)
        resp.raise_for_status()
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Extraction error: {e}")
        error_payload = {
            "job_id": job_id,
            "extracted_data": {"error": str(e)},
            "processing_time_ms": int((time.time() - start_time) * 1000)
        }
        try:
            headers = {"ngrok-skip-browser-warning": "true", "User-Agent": "baseparse-worker/1.0"}
            requests.post(webhook_url, json=error_payload, headers=headers)
        except Exception as we:
            print(f"Webhook error: {we}")
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@app.function(gpu="T4", timeout=600, volumes={TEMP_ASSETS_DIR: assets_volume})
def process_layout_and_webhook(file_data: bytes, job_id: str, webhook_url: str, document_type: str, extract_options: str, gemini_api_key: str):
    print(f"[{job_id}] Starting layout extraction...")
    start_time = time.time()
    
    fd, temp_path = tempfile.mkstemp(suffix=".pdf")
    os.close(fd)
    with open(temp_path, "wb") as f:
        f.write(file_data)
        
    try:
        from google import genai
        from google.genai import types
        from pdf2image import convert_from_path
        import pypdf
        
        if not gemini_api_key:
            raise Exception("GEMINI_API_KEY is not provided.")
            
        client = genai.Client(api_key=gemini_api_key)
        
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
        images = convert_from_path(temp_path, dpi=dpi)
        
        # Extract original dimensions using pypdf
        original_dimensions = []
        try:
            reader = pypdf.PdfReader(temp_path)
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
        
        prompt = """Analyze this document page and extract all structural elements according to the EXACT provided schema. 

CRITICAL INSTRUCTIONS FOR MISSING DATA:
1. BOUNDING BOXES: Provide accurate [x1, y1, x2, y2] pixel coordinates. Boxes MUST visually cover the entire text. Do not generate tiny boxes for large headings.
2. TABLES: If you see a table, you MUST populate `rows`, `columns`, and the `cells` array. Do NOT leave them null.
3. STYLING: You MUST estimate relative `font_size` (e.g. 12, 16, 24) and set `font_weight` and `alignment` for all text elements. Do not leave `style` null.
4. HIERARCHY & PARENTS: You MUST populate `parent_id` to link dependent elements (like a caption MUST have the parent_id of its corresponding figure or table).
5. COLUMNS: You MUST populate the `column` field (e.g., 1 or 2). Even for single-column layouts, set column to 1.
6. SECTIONS & IDs: You MUST group elements into `sections`. The IDs in the `sections.elements` array MUST EXACTLY MATCH the `id` you generated for the element. DO NOT invent placeholder IDs (like 'e7').

Ensure `reading_order` is perfectly sequential starting from 1.
"""
        if extract_options:
            prompt += f"\nCRITICAL: You must ONLY extract elements of the following types: {extract_options}. Ignore all other content.\n"
        
        job_asset_dir = os.path.join(TEMP_ASSETS_DIR, job_id)
        os.makedirs(job_asset_dir, exist_ok=True)
        
        import concurrent.futures
        import threading
        
        lock = threading.Lock()
        
        def process_single_page(i, img):
            nonlocal total_input_tokens, total_output_tokens, pages_failed
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
                        with lock:
                            total_input_tokens += getattr(response.usage_metadata, 'prompt_token_count', 0)
                            total_output_tokens += getattr(response.usage_metadata, 'candidates_token_count', 0)
                    break
                except Exception as e:
                    if attempt == max_retries - 1:
                        print(f"[{job_id}] Page {page_num} failed after {max_retries} attempts: {e}")
                        with lock:
                            pages_failed += 1
                    else:
                        time.sleep(2 ** attempt)
            
            if not page_data:
                return None
            
            page_data.width = img.width
            page_data.height = img.height
            page_data.original_width = orig_dim["width"]
            page_data.original_height = orig_dim["height"]
            page_data.page_number = page_num
            page_data.dpi = dpi
            
            page_assets = []
            
            # Save full page image and thumbnail
            try:
                page_img_id = f"page_{job_id}_p{page_num}"
                page_img_filename = f"{page_img_id}.jpg"
                page_img_filepath = os.path.join(job_asset_dir, page_img_filename)
                img.save(page_img_filepath, format="JPEG", quality=85)
                page_data.page_image_url = f"/api/v1/assets/{job_id}/{page_img_filename}"
                
                thumb_img = img.copy()
                thumb_img.thumbnail((800, 800))
                thumb_filename = f"{page_img_id}_thumb.jpg"
                thumb_filepath = os.path.join(job_asset_dir, thumb_filename)
                thumb_img.save(thumb_filepath, format="JPEG", quality=80)
                page_data.thumbnail_url = f"/api/v1/assets/{job_id}/{thumb_filename}"
                
                expires_at = (datetime.utcnow() + timedelta(hours=24)).isoformat() + "Z"
                page_assets.append({
                    "id": page_img_id,
                    "type": "page_image",
                    "mime": "image/jpeg",
                    "url": page_data.page_image_url,
                    "expires_at": expires_at
                })
            except Exception as e:
                print(f"Failed to extract page image for page {page_num}: {e}")

            # Create mapping for ID replacement in sections/parents
            id_mapping = {}
            for idx, elem in enumerate(page_data.elements):
                old_id = elem.id
                new_id = f"{elem.type}_p{page_num}_{idx+1:03d}"
                id_mapping[old_id] = new_id
                elem.id = new_id
                
                if elem.bbox and len(elem.bbox) == 4:
                    x1, y1, x2, y2 = elem.bbox
                    
                    # Fix bbox inversion hallucinated by model
                    real_x1 = min(x1, x2)
                    real_x2 = max(x1, x2)
                    real_y1 = min(y1, y2)
                    real_y2 = max(y1, y2)
                    
                    elem.bbox = [real_x1, real_y1, real_x2, real_y2]
                    
                    w, h = img.width, img.height
                    elem.bbox_normalized = NormalizedBBox(
                        x=round(real_x1 / w, 4),
                        y=round(real_y1 / h, 4),
                        width=round((real_x2 - real_x1) / w, 4),
                        height=round((real_y2 - real_y1) / h, 4)
                    )
                
                if elem.type in ["image", "figure"] and elem.bbox and len(elem.bbox) == 4:
                    try:
                        x1, y1, x2, y2 = elem.bbox
                        x1, y1 = max(0, x1), max(0, y1)
                        x2, y2 = min(img.width, x2), min(img.height, y2)
                        
                        if x1 >= x2 or y1 >= y2:
                            raise ValueError(f"Invalid crop dimensions: {x1},{y1} to {x2},{y2}")
                        
                        cropped = img.crop((x1, y1, x2, y2))
                        asset_id = f"asset_{job_id}_p{page_num}_{elem.id}"
                        filename = f"{asset_id}.jpg"
                        filepath = os.path.join(job_asset_dir, filename)
                        
                        cropped.save(filepath, format="JPEG", quality=85)
                        asset_url = f"/api/v1/assets/{job_id}/{filename}"
                        expires_at = (datetime.utcnow() + timedelta(hours=24)).isoformat() + "Z"
                        
                        elem.asset_id = asset_id
                        elem.format = "jpeg"
                        
                        page_assets.append({
                            "id": asset_id,
                            "type": elem.type,
                            "mime": "image/jpeg",
                            "url": asset_url,
                            "expires_at": expires_at
                        })
                    except Exception as e:
                        print(f"Failed to extract image asset on page {page_num}: {e}")
            
            # Update sections and parents with new IDs
            if page_data.sections:
                for sec in page_data.sections:
                    if sec.elements:
                        sec.elements = [id_mapping.get(e_id, e_id) for e_id in sec.elements]
            
            for elem in page_data.elements:
                if elem.parent_id and elem.parent_id in id_mapping:
                    elem.parent_id = id_mapping[elem.parent_id]
            
            return (page_data.model_dump(), page_assets)

        # 2. Process each page concurrently
        max_workers = min(10, max(1, len(images)))
        results = [None] * len(images)
        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            future_to_index = {executor.submit(process_single_page, i, img): i for i, img in enumerate(images)}
            for future in concurrent.futures.as_completed(future_to_index):
                i = future_to_index[future]
                try:
                    res = future.result()
                    results[i] = res
                except Exception as exc:
                    print(f"[{job_id}] Page {i+1} generated an exception: {exc}")

        for res in results:
            if res:
                all_pages.append(res[0])
                all_assets.extend(res[1])

        processing_time_ms = int((time.time() - start_time) * 1000)
        
        # 4. Construct Final DOM Response
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
        
        headers = {"ngrok-skip-browser-warning": "true", "User-Agent": "baseparse-worker/1.0"}
        requests.post(webhook_url, json=payload, headers=headers)
        
    except Exception as e:
        print(f"[{job_id}] Layout Error: {e}")
        import traceback
        traceback.print_exc()
        error_payload = {
            "job_id": job_id,
            "extracted_data": {"error": str(e)},
            "processing_time_ms": int((time.time() - start_time) * 1000),
            "status": "error"
        }
        headers = {"ngrok-skip-browser-warning": "true", "User-Agent": "baseparse-worker/1.0"}
        requests.post(webhook_url, json=error_payload, headers=headers)
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        # We need to commit volume changes in Modal if we want the web container to see them immediately
        assets_volume.commit()
        cleanup_old_assets()
        assets_volume.commit()

# 3. Define the FastAPI integration (Web Endpoint)
from fastapi import FastAPI
web_app = FastAPI()

@web_app.post("/api/worker/extract")
async def extract_document(
    file: UploadFile = File(...),
    job_id: str = Form(...),
    webhook_url: str = Form(...),
    priority: str = Form("default")
):
    """
    This endpoint acts as the fast-returning web server. It receives the request,
    spawns the heavy GPU process in the background, and returns immediately.
    """
    file_data = await file.read()
    file_name = file.filename or "document.pdf"
    
    # .spawn() queues the function in Modal's serverless infrastructure immediately
    process_and_webhook.spawn(file_data, file_name, job_id, webhook_url)
    
    return {"status": "processing", "job_id": job_id}

@web_app.post("/api/worker/layout")
async def extract_layout(
    file: UploadFile = File(...),
    job_id: str = Form(...),
    webhook_url: str = Form(...),
    priority: str = Form("default"),
    document_type: str = Form("default"),
    extract: str = Form(""),
    gemini_api_key: str = Form("")
):
    file_data = await file.read()
    process_layout_and_webhook.spawn(file_data, job_id, webhook_url, document_type, extract, gemini_api_key)
    return {"status": "processing", "job_id": job_id}

@web_app.get("/api/worker/assets/{job_id}/{asset_filename}")
async def get_asset(job_id: str, asset_filename: str):
    """Serve cropped assets locally so the Next.js API can proxy them"""
    assets_volume.reload()
    path = os.path.join(TEMP_ASSETS_DIR, job_id, asset_filename)
    if os.path.exists(path) and ".." not in asset_filename: # basic path traversal prevention
        return FileResponse(path)
    raise HTTPException(status_code=404, detail="Asset not found")

# Expose the FastAPI app via Modal
@app.function(volumes={TEMP_ASSETS_DIR: assets_volume})
@modal.asgi_app()
def fastapi_app():
    return web_app
