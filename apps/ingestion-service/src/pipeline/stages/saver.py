from src.models.document import KnowledgeRepresentation
from typing import List, Dict, Any
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from src.core.config import settings
from src.models.database import Document, DocumentNode, DocumentChunk, DocumentEmbedding
from src.core.logger import get_logger

logger = get_logger()
engine = create_engine(settings.POSTGRES_CONNECTION_STRING)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class DatabaseSaver:
    """
    Commits the KnowledgeRepresentation, Chunks, and Embeddings to the Postgres database.
    """
    
    def save(self, representation: KnowledgeRepresentation, chunks: List[dict], embeddings: List[dict]):
        logger.info("Saving document to database", document_id=representation.document_id)
        
        with SessionLocal() as db:
            try:
                # 1. Update Document Status or Create Document if it doesn't exist
                doc = db.query(Document).filter(Document.id == representation.document_id).first()
                if doc:
                    doc.status = "completed"
                else:
                    doc = Document(
                        id=representation.document_id, 
                        title=f"Test Document {representation.document_id}", 
                        source_type="pdf",
                        status="completed"
                    )
                    db.add(doc)
                    db.flush()
                
                # 2. Insert Nodes
                for node in representation.nodes:
                    db_node = DocumentNode(
                        id=node.id,
                        document_id=representation.document_id,
                        node_type=node.type.value,
                        content=node.content,
                        page_number=node.page_number,
                        bounding_box=node.bounding_box,
                        metadata_json=node.metadata
                    )
                    db.add(db_node)
                
                db.flush() # Get IDs if needed
                
                # 3. Insert Chunks & Embeddings (Simplified)
                # Note: 'chunks' here is technically List[Chunk] in the pipeline
                # Let's map it safely.
                
                for i, chunk in enumerate(chunks):
                    db_chunk = DocumentChunk(
                        document_id=representation.document_id,
                        chunk_type=chunk.chunk_type,
                        content=chunk.content,
                        level=chunk.level,
                        page_number=chunk.page_number,
                        bounding_box=chunk.bounding_box,
                        artifact_refs=chunk.node_refs, # Storing references to the nodes
                        assets=chunk.assets # Separate base64 payloads
                    )
                    db.add(db_chunk)
                    db.flush()
                    
                    # Match embedding by index
                    if i < len(embeddings):
                        db_emb = DocumentEmbedding(
                            document_id=representation.document_id,
                            chunk_id=db_chunk.id,
                            model=embeddings[i]["model"],
                            vector=embeddings[i]["vector"]
                        )
                        db.add(db_emb)
                
                if doc and doc.source_id:
                    # Update sync_job status to completed
                    from sqlalchemy import text
                    db.execute(
                        text("UPDATE sync_jobs SET status = 'completed', finished_at = NOW() WHERE source_id = :source_id"),
                        {"source_id": doc.source_id}
                    )
                    
                db.commit()
                logger.info("Successfully saved document", document_id=representation.document_id)
                
            except Exception as e:
                db.rollback()
                logger.error("Failed to save document", error=str(e), document_id=representation.document_id)
                raise e
