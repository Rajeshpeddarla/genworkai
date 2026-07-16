import os
from src.pipeline.stages.parser import BaseParser
from src.models.document import ParsedDocument

class TxtParser(BaseParser):
    def parse(self, file_path: str, document_id: int) -> ParsedDocument:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
            
        with open(file_path, 'r', encoding='utf-8') as f:
            text = f.read()
            
        # Basic split by double newline to identify paragraphs
        paragraphs = text.split('\n\n')
        
        extracted_elements = []
        for i, para in enumerate(paragraphs):
            para = para.strip()
            if para:
                extracted_elements.append({
                    "type": "paragraph",
                    "content": para,
                    "index": i
                })
                
        return ParsedDocument(
            document_id=document_id,
            raw_text=text,
            extracted_elements=extracted_elements,
            metadata={"parser": "TxtParser"}
        )
