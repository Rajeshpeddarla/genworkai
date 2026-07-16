from typing import List, Optional, Dict, Any
from enum import Enum
from pydantic import BaseModel, Field

class NodeType(str, Enum):
    HEADING = "heading"
    PARAGRAPH = "paragraph"
    LIST = "list"
    CODE_BLOCK = "code_block"
    TABLE = "table"
    IMAGE = "image"
    FORMULA = "formula"

class KnowledgeNode(BaseModel):
    """
    A normalized component of a document (e.g., a single paragraph, an image reference, a heading).
    Provides a stable ID for future citations and editing.
    """
    id: str
    type: NodeType
    content: Optional[str] = None
    page_number: Optional[int] = None
    bounding_box: Optional[List[float]] = None 
    metadata: Dict[str, Any] = Field(default_factory=dict)

class KnowledgeRepresentation(BaseModel):
    """
    The universal internal document format. Everything after normalization consumes this representation.
    """
    document_id: int
    metadata: Dict[str, Any] = Field(default_factory=dict)
    assets: Dict[str, str] = Field(default_factory=dict)
    nodes: List[KnowledgeNode] = Field(default_factory=list)

class ParsedDocument(BaseModel):
    """
    The raw output from a specific parser (e.g., pdf_parser) before normalization.
    """
    document_id: int
    raw_text: str
    extracted_elements: List[Dict[str, Any]] = Field(default_factory=list)
    assets: Dict[str, str] = Field(default_factory=dict)
    metadata: Dict[str, Any] = Field(default_factory=dict)
