import os
import re
from src.pipeline.stages.parser import BaseParser
from src.models.document import ParsedDocument

class MarkdownParser(BaseParser):
    def parse(self, file_path: str, document_id: int) -> ParsedDocument:
        with open(file_path, 'r', encoding='utf-8') as f:
            text = f.read()
            
        lines = text.split('\n')
        extracted_elements = []
        
        current_paragraph = []
        
        def commit_paragraph():
            if current_paragraph:
                extracted_elements.append({
                    "type": "paragraph",
                    "content": "\n".join(current_paragraph).strip()
                })
                current_paragraph.clear()
        
        in_code_block = False
        code_block_content = []
        
        for line in lines:
            # Code blocks
            if line.startswith('```'):
                if in_code_block:
                    extracted_elements.append({
                        "type": "code_block",
                        "content": "\n".join(code_block_content)
                    })
                    code_block_content = []
                    in_code_block = False
                else:
                    commit_paragraph()
                    in_code_block = True
                continue
                
            if in_code_block:
                code_block_content.append(line)
                continue
                
            # Headings
            match = re.match(r'^(#{1,6})\s+(.*)', line)
            if match:
                commit_paragraph()
                level = len(match.group(1))
                extracted_elements.append({
                    "type": "heading",
                    "content": match.group(2).strip(),
                    "level": level
                })
                continue
                
            # Lists (very basic check)
            if re.match(r'^[\*\-\+]\s+.*|^\d+\.\s+.*', line.strip()):
                commit_paragraph()
                extracted_elements.append({
                    "type": "list",
                    "content": line.strip()
                })
                continue
                
            if not line.strip():
                commit_paragraph()
            else:
                current_paragraph.append(line)
                
        commit_paragraph()

        return ParsedDocument(
            document_id=document_id,
            raw_text=text,
            extracted_elements=extracted_elements,
            metadata={"parser": "MarkdownParser"}
        )
