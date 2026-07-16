from src.pipeline.stages.parser import BaseParser
from src.models.document import ParsedDocument

import pypdfium2 as pdfium
import google.generativeai as genai
import os
import io
import base64
from PIL import Image
import concurrent.futures

# Initialize Gemini
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

import json
import typing_extensions as typing
import uuid
from src.utils.asset_extractor import AssetExtractor

class Diagram(typing.TypedDict):
    id: str
    ymin: float
    xmin: float
    ymax: float
    xmax: float

class ExtractedPage(typing.TypedDict):
    markdown_content: str
    diagrams: list[Diagram]

class PDFParser(BaseParser):
    def __init__(self):
        super().__init__()
        # Use gemini-3.1-flash-lite for structured JSON output capabilities and higher limits
        self.vision_model = genai.GenerativeModel('gemini-3.1-flash-lite')
        self.asset_extractor = AssetExtractor()
        
    def _describe_image_with_gemini(self, pil_image: Image.Image) -> str:
        """Sends a PIL Image to Gemini 3.5 Flash to extract semantic meaning/formulas as JSON."""
        import time
        max_retries = 3
        
        prompt = (
            "You are an expert academic data extractor. Extract all text, mathematical formulas, and describe any diagrams on this page. "
            "Output the results in the required JSON format. "
            "Ensure all math formulas are correctly formatted in LaTeX within `markdown_content`. "
            "If there are any diagrams or charts, add them to the `diagrams` array with a unique string `id`. "
            "For each diagram, output its bounding box with normalized coordinates (0 to 1000). "
            "In the `markdown_content`, exactly where the diagram appears, insert a placeholder: [DIAGRAM_{id}] "
            "Do not include any conversational filler."
        )
        
        # Explicitly convert to bytes to bypass Gemini SDK PIL bugs
        img_byte_arr = io.BytesIO()
        rgb_im = pil_image.convert('RGB')
        rgb_im.save(img_byte_arr, format='JPEG')
        
        image_blob = {
            "mime_type": "image/jpeg",
            "data": img_byte_arr.getvalue()
        }
        
        for attempt in range(max_retries):
            try:
                response = self.vision_model.generate_content(
                    [prompt, image_blob],
                    generation_config=genai.GenerationConfig(
                        response_mime_type="application/json",
                        temperature=0.1,
                    )
                )
                return response.text.strip()
            except Exception as e:
                if attempt < max_retries - 1:
                    time.sleep(2 ** attempt)  # Exponential backoff
                    continue
                return json.dumps({"markdown_content": f"[Failed to extract page content: {str(e)}]", "diagrams": []})

    def parse(self, file_path: str, document_id: int) -> ParsedDocument:
        extracted_elements = []
        full_text = []
        assets_dict = {}
        
        try:
            pdf = pdfium.PdfDocument(file_path)
            pil_images = []
            
            # 1. Render all pages to PIL images sequentially
            for page_num in range(len(pdf)):
                page = pdf[page_num]
                bitmap = page.render(scale=2)
                pil_images.append(bitmap.to_pil())
                
            # 2. Extract JSON strings in parallel to reduce timeout / wait time
            with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
                json_results = list(executor.map(self._describe_image_with_gemini, pil_images))
                
            # 3. Process each page sequentially
            for page_num, (pil_image, extracted_json_str) in enumerate(zip(pil_images, json_results)):
                
                try:
                    result_json = json.loads(extracted_json_str)
                    markdown_content = result_json.get("markdown_content", "")
                    diagrams = result_json.get("diagrams", [])
                    
                    # Crop diagrams and upload to Supabase
                    for diag in diagrams:
                        d_id = diag.get("id")
                        if not d_id: continue
                        
                        # Convert normalized coords (0-1000) to pixels
                        img_width, img_height = pil_image.size
                        xmin = int(diag.get("xmin", 0) * img_width / 1000)
                        ymin = int(diag.get("ymin", 0) * img_height / 1000)
                        xmax = int(diag.get("xmax", 1000) * img_width / 1000)
                        ymax = int(diag.get("ymax", 1000) * img_height / 1000)
                        
                        # Validate bounds
                        xmin = max(0, min(xmin, img_width))
                        xmax = max(0, min(xmax, img_width))
                        ymin = max(0, min(ymin, img_height))
                        ymax = max(0, min(ymax, img_height))
                        
                        if xmax > xmin and ymax > ymin:
                            cropped = pil_image.crop((xmin, ymin, xmax, ymax))
                            
                            # Compress to highly optimized WEBP
                            buf = io.BytesIO()
                            cropped.save(buf, format="WEBP", quality=80, method=4)
                            file_bytes = buf.getvalue()
                            
                            # Encode as Base64 to bypass storage needs
                            base64_str = base64.b64encode(file_bytes).decode("utf-8")
                            
                            # Generate a unique UUID for the asset
                            asset_uuid = str(uuid.uuid4())
                            
                            # Store in assets dictionary
                            assets_dict[asset_uuid] = f"data:image/webp;base64,{base64_str}"
                            
                            # Replace placeholder in markdown with clean asset reference
                            placeholder = f"[DIAGRAM_{d_id}]"
                            img_markdown = f"\n\n![Diagram](asset://{asset_uuid})\n\n"
                            markdown_content = markdown_content.replace(placeholder, img_markdown)
                            
                except Exception as e:
                    print(f"[PDFParser] Error parsing JSON or uploading images on page {page_num+1}: {e}")
                    # Fallback if json parsing fails entirely
                    markdown_content = extracted_json_str
                
                full_text.append(markdown_content)
                extracted_elements.append({
                    "type": "page_content",
                    "content": markdown_content,
                    "page_number": page_num + 1
                })
                
        except Exception as e:
            # Fallback if parsing fails
            extracted_elements.append({
                "type": "paragraph",
                "content": f"Failed to parse PDF: {str(e)}",
                "page_number": 1
            })
            full_text = [f"Failed to parse PDF: {str(e)}"]
            
        return ParsedDocument(
            document_id=document_id,
            raw_text="\n\n".join(full_text),
            extracted_elements=extracted_elements,
            assets=assets_dict,
            metadata={"parser": "PDFParser", "pages": len(extracted_elements)}
        )

class DocxParser(BaseParser):
    def parse(self, file_path: str, document_id: int) -> ParsedDocument:
        # In a full implementation, we'd use python-docx here.
        extracted_elements = [
            {"type": "paragraph", "content": "Mock DOCX content for document " + str(document_id)}
        ]
        
        return ParsedDocument(
            document_id=document_id,
            raw_text="Mock DOCX content for document " + str(document_id),
            extracted_elements=extracted_elements,
            metadata={"parser": "DocxParser"}
        )
