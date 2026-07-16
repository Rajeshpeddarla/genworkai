import os
import tempfile
from src.core.supabase import get_supabase_client
from src.core.logger import get_logger
from src.pipeline.parsers.txt_parser import TxtParser
from src.pipeline.parsers.md_parser import MarkdownParser
from src.pipeline.parsers.binary_parsers import PDFParser, DocxParser

from src.pipeline.stages.normalizer import Normalizer
from src.pipeline.stages.chunker import ChunkGenerator
from src.pipeline.stages.embedder import EmbeddingGenerator
from src.pipeline.stages.saver import DatabaseSaver

logger = get_logger()

# Pre-load embedder to keep it in memory for the worker
embedder = EmbeddingGenerator()
normalizer = Normalizer()
chunker = ChunkGenerator()
saver = DatabaseSaver()

def get_parser(mime_type: str):
    if mime_type == 'text/plain':
        return TxtParser()
    elif mime_type == 'text/markdown':
        return MarkdownParser()
    elif mime_type == 'application/pdf':
        return PDFParser()
    elif mime_type in ('application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'):
        return DocxParser()
    else:
        raise ValueError(f"Unsupported mime type: {mime_type}")

def process_document(document_id: int, storage_key: str, mime_type: str):
    logger.info("Starting ingestion job", document_id=document_id, mime_type=mime_type)
    
    supabase = get_supabase_client()
    
    # 1. Download file from Supabase Storage
    # Assuming it's in a bucket named 'documents'
    try:
        # Check if local file exists first (mounted from Next.js public/uploads)
        local_path = os.path.join("/app/uploads", storage_key)
        
        if os.path.exists(local_path):
            logger.info("Using local file", path=local_path)
            tmp_path = local_path
        else:
            response = supabase.storage.from_("documents").download(storage_key)
            
            # Save to temp file
            _, ext = os.path.splitext(storage_key)
            with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp_file:
                tmp_file.write(response)
                tmp_path = tmp_file.name
                
            logger.info("File downloaded from Supabase", path=tmp_path)
            
        # 2. Parse
        parser = get_parser(mime_type)
        parsed_doc = parser.parse(tmp_path, document_id)
        logger.info("Parsing complete", elements_count=len(parsed_doc.extracted_elements))
        
        # 3. Normalize
        knowledge_rep = normalizer.normalize(parsed_doc)
        logger.info("Normalization complete", nodes_count=len(knowledge_rep.nodes))
        
        # 4. Chunk
        chunks = chunker.generate(knowledge_rep)
        logger.info("Chunking complete", chunks_count=len(chunks))
        
        # 5. Embed
        embeddings = embedder.embed(chunks)
        logger.info("Embedding complete")
        
        # 6. Save
        saver.save(knowledge_rep, chunks, embeddings)
        logger.info("Ingestion complete")
        
    except Exception as e:
        logger.error("Job failed", error=str(e), document_id=document_id)
        # Update document status to error in a real system
        raise e
    finally:
        if 'tmp_path' in locals() and os.path.exists(tmp_path):
            if 'local_path' not in locals() or tmp_path != local_path:
                os.remove(tmp_path)
