import os
import tempfile
import time
import requests
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, BackgroundTasks
from pydantic import BaseModel

try:
    from docling.document_converter import DocumentConverter
    DOCLING_AVAILABLE = True
except ImportError:
    DOCLING_AVAILABLE = False

router = APIRouter()

def process_and_webhook(file_path: str, job_id: str, webhook_url: str):
    start_time = time.time()
    try:
        pages_list = []
        if DOCLING_AVAILABLE:
            converter = DocumentConverter()
            result = converter.convert(file_path)
            
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
            md_text = result.document.export_to_markdown() # For token counting estimation
        else:
            md_text = f"# Mock Document\n\nContent for job {job_id}"
            pages_list = [{
                "page": 1,
                "width": 0,
                "height": 0,
                "blocks": [
                    {
                        "id": "mock_001",
                        "type": "paragraph",
                        "text": md_text
                    }
                ]
            }]
            
        processing_time_ms = int((time.time() - start_time) * 1000)
        
        payload = {
            "job_id": job_id,
            "extracted_data": {
                "pages": pages_list,
                "document": {"pages": len(pages_list)},
                "usage": {"input_tokens": len(md_text)//4 if DOCLING_AVAILABLE else 0, "output_tokens": len(md_text) if DOCLING_AVAILABLE else 0}
            },
            "processing_time_ms": processing_time_ms
        }
        
        requests.post(webhook_url, json=payload)
        
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
            requests.post(webhook_url, json=error_payload)
        except Exception as we:
            print(f"Webhook error: {we}")
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)

@router.post("/extract")
async def extract_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    job_id: str = Form(...),
    webhook_url: str = Form(...),
    priority: str = Form("default")
):
    # Save uploaded file to temp path
    fd, temp_path = tempfile.mkstemp(suffix=".pdf")
    os.close(fd)
    
    with open(temp_path, "wb") as buffer:
        buffer.write(await file.read())
        
    # Queue background task to process file and call webhook
    background_tasks.add_task(process_and_webhook, temp_path, job_id, webhook_url)
    
    return {"status": "processing", "job_id": job_id}
