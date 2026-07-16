from typing import List, Optional
from pydantic import BaseModel

class Chunk(BaseModel):
    """
    A chunk of text generated from the KnowledgeRepresentation.
    Chunking is completely independent of the original document format.
    """
    chunk_id: str
    content: str
    chunk_type: str # e.g., 'text', 'header'
    node_refs: List[str] # IDs of KnowledgeNodes attached to this chunk (e.g., Image/Formula IDs)
    level: int = 3
    page_number: Optional[int] = None
    bounding_box: Optional[List[float]] = None 
    assets: Optional[dict] = None
