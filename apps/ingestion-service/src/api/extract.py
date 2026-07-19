import os
import json
import uuid
from typing import List, Dict, Any
from fastapi import APIRouter, UploadFile, File, HTTPException
import pypdfium2 as pdfium
from PIL import Image
import io
import google.generativeai as genai
import urllib.request
import urllib.error

router = APIRouter()

# Configure Supabase
supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
supabase_key = os.environ.get("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")

# Configure Gemini
gemini_key = os.environ.get("GEMINI_API_KEY")
if gemini_key:
    genai.configure(api_key=gemini_key)

@router.post("/extract")
async def extract_document(file: UploadFile = File(...)):
    if not gemini_key:
        raise HTTPException(status_code=500, detail="Gemini API Key missing")
        
    try:
        file_bytes = await file.read()
        
        # Step 1: Render PDF pages to images using pypdfium2 at 300 DPI
        pdf = pdfium.PdfDocument(file_bytes)
        page_images = []
        # Render each page. scale=300/72 ≈ 4.16 for 300 DPI
        scale = 300 / 72
        for i in range(len(pdf)):
            page = pdf[i]
            bitmap = page.render(scale=scale)
            pil_image = bitmap.to_pil()
            page_images.append(pil_image)
            
        # Step 2: Call Gemini Document Intelligence in parallel batches
        model = genai.GenerativeModel("gemini-3.1-flash-lite")
        import concurrent.futures

        def extract_page(args):
            page_idx, pil_image = args
            page_prompt = f"""You are the BaseParse Document Intelligence engine.
Analyze the provided page image (Page {page_idx + 1}) and extract its full structural intelligence into standard JSON.
Preserve the exact reading order using an ordered list of blocks.

Output JSON format:
{{
  "page": {page_idx + 1},
  "width": 1000,
  "height": 1000,
  "blocks": [
    {{
      "id": "paragraph_{page_idx + 1}_001",
      "type": "paragraph",
      "text": "Extracted text...",
      "bbox": [ymin, xmin, ymax, xmax]
    }}
  ]
}}

CRITICAL RULES:
1. 'bbox' must be [ymin, xmin, ymax, xmax] coordinates normalized between 0 and 1000.
2. Extract all tables, equations (wrapped in LaTeX), images, and diagrams as separate blocks.
3. Do not omit any content. Preserve exact reading order."""
            
            img_byte_arr = io.BytesIO()
            pil_image.convert('RGB').save(img_byte_arr, format='JPEG')
            
            for attempt in range(3):
                try:
                    response = model.generate_content(
                        contents=[
                            {"mime_type": "image/jpeg", "data": img_byte_arr.getvalue()},
                            page_prompt
                        ],
                        generation_config={"response_mime_type": "application/json"},
                        request_options={"timeout": 60}
                    )
                    return json.loads(response.text)
                except Exception as e:
                    if attempt == 2:
                        return {"page": page_idx + 1, "width": 1000, "height": 1000, "blocks": [{"id": f"error_{page_idx}", "type": "paragraph", "text": f"Error: {str(e)}", "bbox": [0,0,1000,1000]}]}
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            pages_data = list(executor.map(extract_page, enumerate(page_images)))

        # Sort just in case futures returned out of order (though map keeps order)
        pages_data.sort(key=lambda x: x.get("page", 0))

        extracted_data = {
            "document": {
                "title": file.filename,
                "pages": len(page_images)
            },
            "pages": pages_data
        }
        
        # Step 3 & 4: Crop physical assets and upload
        document_id = str(uuid.uuid4())
        
        for page_data in extracted_data.get("pages", []):
            page_num = page_data.get("page", 1)
            # Ensure valid page index
            page_idx = page_num - 1
            if page_idx < 0 or page_idx >= len(page_images):
                continue
                
            pil_image = page_images[page_idx]
            img_width, img_height = pil_image.size
            
            for block in page_data.get("blocks", []):
                block_type = block.get("type")
                bbox = block.get("bbox")
                
                if block_type in ["image", "table", "equation", "diagram"] and bbox and len(bbox) == 4:
                    # Normalized coords to physical pixels
                    ymin, xmin, ymax, xmax = bbox
                    
                    left = (xmin / 1000.0) * img_width
                    top = (ymin / 1000.0) * img_height
                    right = (xmax / 1000.0) * img_width
                    bottom = (ymax / 1000.0) * img_height
                    
                    # Crop
                    try:
                        cropped = pil_image.crop((left, top, right, bottom))
                        img_byte_arr = io.BytesIO()
                        cropped.save(img_byte_arr, format='PNG')
                        img_byte_arr = img_byte_arr.getvalue()
                        
                        asset_filename = f"{document_id}/{block.get('id', uuid.uuid4())}.png"
                        
                        # Upload to Supabase Storage natively to avoid SDK JWT validation bugs
                        if supabase_url and supabase_key:
                            upload_url = f"{supabase_url}/storage/v1/object/baseparse-assets/{asset_filename}"
                            req = urllib.request.Request(upload_url, data=img_byte_arr, method='POST')
                            req.add_header('apikey', supabase_key)
                            req.add_header('Content-Type', 'image/png')
                            
                            urllib.request.urlopen(req)
                            
                            # Get Public URL
                            public_url = f"{supabase_url}/storage/v1/object/public/baseparse-assets/{asset_filename}"
                            block["image_url"] = public_url
                        else:
                            block["image_url"] = f"https://mock-storage.com/{asset_filename}"
                            
                    except Exception as e:
                        print(f"Failed to crop/upload block {block.get('id')}: {e}")
                        block["image_url"] = None

        return extracted_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
