import os
import sys
import json

# Add src to python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from src.pipeline.parsers.binary_parsers import PDFParser

pdf_path = r"C:\Users\varun\.gemini\antigravity-ide\scratch\genworkai\apps\pipeline\sterling-accuris-pathology-sample-report-unlocked.pdf"

if __name__ == "__main__":
    parser = PDFParser()
    print("Parsing PDF...")
    try:
        parsed_doc = parser.parse(pdf_path, document_id=123)
        print("\n--- Parsed Markdown Content ---")
        print(parsed_doc.raw_text)
        print("\n--- Metadata ---")
        print(json.dumps(parsed_doc.metadata, indent=2))
        print("\n--- Assets ---")
        print(f"Extracted {len(parsed_doc.assets)} assets.")
    except Exception as e:
        print(f"Error: {e}")
