from src.models.document import ParsedDocument, KnowledgeRepresentation, KnowledgeNode, NodeType
import uuid
from datetime import datetime

class Normalizer:
    """
    Converts any format-specific ParsedDocument into the universal KnowledgeRepresentation.
    """
    
    def normalize(self, parsed_doc: ParsedDocument) -> KnowledgeRepresentation:
        nodes = []
        for el in parsed_doc.extracted_elements:
            try:
                n_type = NodeType(el.get("type"))
            except ValueError:
                n_type = NodeType.PARAGRAPH
                
            node = KnowledgeNode(
                id=uuid.uuid4().hex,
                type=n_type,
                content=el.get("content"),
                page_number=el.get("page"),
                metadata=el.get("metadata", {})
            )
            nodes.append(node)
            
        metadata = parsed_doc.metadata.copy()
        metadata["normalized_at"] = datetime.utcnow().isoformat()
            
        return KnowledgeRepresentation(
            document_id=parsed_doc.document_id,
            metadata=metadata,
            assets=parsed_doc.assets,
            nodes=nodes
        )
