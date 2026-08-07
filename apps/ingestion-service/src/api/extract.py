import os
import json
import uuid
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Form
import pypdfium2 as pdfium
from PIL import Image
import io
import google.generativeai as genai
import urllib.request
import urllib.error
import concurrent.futures
import time
from rq import Queue
from redis import Redis

router = APIRouter()

# Setup Redis connection and RQ queues
redis_url = os.environ.get("REDIS_URL", "redis://redis:6379/0")
redis_conn = Redis.from_url(redis_url)

high_queue = Queue("high", connection=redis_conn)
default_queue = Queue("default", connection=redis_conn)

# Configure Supabase
supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
supabase_key = os.environ.get("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")

# Configure Gemini
gemini_key = os.environ.get("GEMINI_API_KEY")
if gemini_key:
    genai.configure(api_key=gemini_key)

def process_document_background(file_bytes: bytes, filename: str, job_id: str, webhook_url: str):
    print(f"Starting background job {job_id} for {filename}")
    start_time = time.time()
    extracted_data = {}
    try:
        tmp_dir = f"/tmp/baseparse/{job_id}"
        os.makedirs(tmp_dir, exist_ok=True)
        
        # Step 1: Render PDF pages to images (Memory-Safe Streaming to Disk)
        pdf = pdfium.PdfDocument(file_bytes)
        scale = 150 / 72
        page_count = len(pdf)
        
        for i in range(page_count):
            page = pdf[i]
            bitmap = page.render(scale=scale)
            pil_image = bitmap.to_pil()
            pil_image.convert('RGB').save(f"{tmp_dir}/{i}.webp", format='WEBP')
            
        # Step 2: Call Gemini Document Intelligence in parallel batches
        model = genai.GenerativeModel("gemini-3.1-flash-lite")

        def extract_page(page_idx):
            page_prompt = f"""You are the BaseParse Document Intelligence engine.
Analyze the provided page image (Page {page_idx + 1}) and extract its full structural intelligence into standard JSON.
Preserve the exact reading order using an ordered list of blocks.

Output JSON format:
{{
  "page_number": {page_idx + 1},
  "status": "completed",
  "dimensions": {{ "width": 1000, "height": 1000 }},
  "blocks": [
    {{
      "id": "paragraph_{page_idx + 1}_001",
      "type": "paragraph",
      "text": "Extracted text...",
      "bbox": {{ "x1": 128, "y1": 375, "x2": 646, "y2": 500 }},
      "confidence": 0.95
    }},
    {{
      "id": "table_{page_idx + 1}_001",
      "type": "table",
      "text": "Flattened text...",
      "bbox": {{ "x1": 128, "y1": 550, "x2": 900, "y2": 800 }},
      "table": {{
        "columns": ["Col1", "Col2"],
        "rows": [ {{ "cells": [ {{"text": "val1"}}, {{"text": "val2"}} ] }} ],
        "markdown": "| Col1 | Col2 |\\n|---|---|\\n| val1 | val2 |"
      }}
    }}
  ]
}}

CRITICAL RULES:
1. 'bbox' must be a coordinate object with properties {{"x1", "y1", "x2", "y2"}} normalized between 0 and 1000.
2. Extract all tables, equations (wrapped in LaTeX), meaningful images, and diagrams as separate blocks.
3. CRITICAL: Do NOT extract decorative images, watermarks, brand logos, QR codes, barcodes, or signatures as blocks. Ignore them entirely.
4. Tables MUST include the structured `table` object with `columns`, `rows`, and `markdown`.
5. Do not omit any actual content. Preserve exact reading order."""
            
            with open(f"{tmp_dir}/{page_idx}.webp", "rb") as f:
                img_data = f.read()
                
            for attempt in range(3):
                try:
                    response = model.generate_content(
                        contents=[
                            {"mime_type": "image/webp", "data": img_data},
                            page_prompt
                        ],
                        generation_config={"response_mime_type": "application/json"},
                        request_options={"timeout": 60}
                    )
                    
                    res_json = json.loads(response.text)
                    
                    # Track usage safely
                    usage = getattr(response, 'usage_metadata', None)
                    input_tokens = getattr(usage, 'prompt_token_count', 0) if usage else 0
                    output_tokens = getattr(usage, 'candidates_token_count', 0) if usage else 0
                    
                    res_json["_usage"] = {"input": input_tokens, "output": output_tokens}
                    
                    return res_json
                except Exception as e:
                    if attempt == 2:
                        return {"page_number": page_idx + 1, "status": "failed", "dimensions": {"width": 1000, "height": 1000}, "blocks": [{"id": f"error_{page_idx}", "type": "paragraph", "text": f"Error: {str(e)}", "bbox": {"x1":0,"y1":0,"x2":1000,"y2":1000}}], "_usage": {"input": 0, "output": 0}}
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=20) as executor:
            pages_data = list(executor.map(extract_page, range(page_count)))

        # Sort just in case
        pages_data.sort(key=lambda x: x.get("page_number", 0))

        # Accumulate usage tokens
        total_input = sum(p.get("_usage", {}).get("input", 0) for p in pages_data)
        total_output = sum(p.get("_usage", {}).get("output", 0) for p in pages_data)
        for p in pages_data:
            if "_usage" in p:
                del p["_usage"]

        # Step 3 & 4: Crop physical assets and upload in parallel with SIGNED URLs
        def upload_asset(args):
            page_idx, block = args
            
            # Load the temporary webp to crop
            pil_image = Image.open(f"{tmp_dir}/{page_idx}.webp")
            img_width, img_height = pil_image.size
            bbox = block.get("bbox")
            
            xmin = bbox.get("x1", 0)
            ymin = bbox.get("y1", 0)
            xmax = bbox.get("x2", 1000)
            ymax = bbox.get("y2", 1000)
            
            left = (xmin / 1000.0) * img_width
            top = (ymin / 1000.0) * img_height
            right = (xmax / 1000.0) * img_width
            bottom = (ymax / 1000.0) * img_height
            
            try:
                cropped = pil_image.crop((left, top, right, bottom))
                img_byte_arr = io.BytesIO()
                cropped.save(img_byte_arr, format='PNG')
                img_byte_arr = img_byte_arr.getvalue()
                
                asset_filename = f"{job_id}/{block.get('id', uuid.uuid4())}.png"
                
                if supabase_url and supabase_key:
                    # Upload
                    upload_url = f"{supabase_url}/storage/v1/object/baseparse-assets/{asset_filename}"
                    req = urllib.request.Request(upload_url, data=img_byte_arr, method='POST')
                    req.add_header('apikey', supabase_key)
                    req.add_header('Authorization', f'Bearer {supabase_key}')
                    req.add_header('Content-Type', 'image/png')
                    urllib.request.urlopen(req)
                    
                    # Get signed URL (7 days valid)
                    sign_url = f"{supabase_url}/storage/v1/object/sign/baseparse-assets/{asset_filename}"
                    sign_req = urllib.request.Request(sign_url, data=json.dumps({"expiresIn": 604800}).encode(), method='POST')
                    sign_req.add_header('apikey', supabase_key)
                    sign_req.add_header('Authorization', f'Bearer {supabase_key}')
                    sign_req.add_header('Content-Type', 'application/json')
                    sign_res = urllib.request.urlopen(sign_req)
                    sign_data = json.loads(sign_res.read())
                    signed_url = f"{supabase_url}/storage/v1{sign_data['signedURL']}"
                    
                    block["asset"] = {
                        "status": "available",
                        "url": signed_url,
                        "mime_type": "image/png"
                    }
                else:
                    block["asset"] = {
                        "status": "available",
                        "url": f"https://mock-storage.com/{asset_filename}?token=mock",
                        "mime_type": "image/png"
                    }
                    
            except Exception as e:
                print(f"Failed to crop/upload block {block.get('id')}: {e}")
                block["asset"] = {
                    "status": "failed",
                    "error": str(e)
                }

        upload_tasks = []
        for page_data in pages_data:
            page_num = page_data.get("page_number", 1)
            page_idx = page_num - 1
            if page_idx < 0 or page_idx >= page_count:
                continue
            for block in page_data.get("blocks", []):
                block_type = block.get("type")
                bbox = block.get("bbox")
                if block_type in ["image", "table", "equation", "diagram"] and bbox and isinstance(bbox, dict):
                    upload_tasks.append((page_idx, block))
                    
        if upload_tasks:
            with concurrent.futures.ThreadPoolExecutor(max_workers=20) as executor:
                list(executor.map(upload_asset, upload_tasks))

        # Build final extracted data wrapper
        extracted_data = {
            "document": {
                "title": filename,
                "pages": page_count
            },
            "pages": pages_data,
            "usage": {
                "input_tokens": total_input,
                "output_tokens": total_output
            }
        }
        
    except Exception as e:
        print(f"Job {job_id} failed: {e}")
        extracted_data = {"error": str(e)}
        
    finally:
        # Cleanup temp directory
        try:
            if os.path.exists(tmp_dir):
                for f in os.listdir(tmp_dir):
                    os.remove(os.path.join(tmp_dir, f))
                os.rmdir(tmp_dir)
        except Exception as e:
            print(f"Failed to cleanup temp dir: {e}")

        # Webhook callback to Next.js
        if webhook_url:
            print(f"Sending webhook to {webhook_url}")
            try:
                payload = {
                    "job_id": job_id,
                    "extracted_data": extracted_data,
                    "processing_time_ms": int((time.time() - start_time) * 1000)
                }
                req = urllib.request.Request(webhook_url, data=json.dumps(payload).encode(), method='POST')
                req.add_header('Content-Type', 'application/json')
                urllib.request.urlopen(req)
            except Exception as e:
                print(f"Webhook delivery failed: {e}")

@router.post("/extract")
async def extract_document(
    file: UploadFile = File(...),
    job_id: str = Form(...),
    webhook_url: str = Form(...),
    priority: str = Form("default")
):
    if not supabase_url or not supabase_key:
        raise HTTPException(status_code=500, detail="Supabase credentials missing")
        
    if not gemini_key:
        raise HTTPException(status_code=500, detail="Gemini API Key missing")
    try:
        file_bytes = await file.read()
        filename = file.filename
        
        # Enqueue to RQ based on priority
        target_queue = high_queue if priority == "high" else default_queue
        
        target_queue.enqueue(
            process_document_background,
            file_bytes,
            filename,
            job_id,
            webhook_url,
            job_timeout=3600
        )
        
        return {"status": "queued", "job_id": job_id, "queue": priority}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
