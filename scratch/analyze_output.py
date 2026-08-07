import json
from collections import Counter

file_path = r"c:\Users\varun\.gemini\antigravity-ide\scratch\genworkai\apps\pipeline\output.json"
with open(file_path, "r") as f:
    data = json.load(f)

print(f"Total Pages: {data.get('pagesProcessed')}")
print(f"Processing Time: {data.get('metadata', {}).get('processingTimeMs')} ms")

block_types = Counter()
images_with_tables = 0
tables_extracted_as_text = 0

for page in data.get('pages', []):
    for block in page.get('blocks', []):
        btype = block.get('type')
        block_types[btype] += 1
        
        # Check if an image block contains table-like characteristics (often just the type being image but the content is tabular)
        # We can't see the image visually, but we can see the text if any is associated, or just the fact that it's an image.
        
        # In Gemini extraction, tables should ideally be type='table' or just markdown tables inside text.

print("\nBlock Type Distribution:")
for k, v in block_types.items():
    print(f"  {k}: {v}")

# Let's inspect a few image blocks and table blocks
print("\nFirst 3 Table Blocks (if any):")
table_count = 0
for page in data.get('pages', []):
    for block in page.get('blocks', []):
        if block.get('type') == 'table' and table_count < 3:
            print(f"- Page {page['page']}: {block.get('text', '')[:100]}...")
            table_count += 1

print("\nFirst 3 Image Blocks:")
image_count = 0
for page in data.get('pages', []):
    for block in page.get('blocks', []):
        if block.get('type') in ['image', 'diagram'] and image_count < 3:
            print(f"- Page {page['page']}: id={block.get('id')} bbox={block.get('bbox')}")
            image_count += 1

