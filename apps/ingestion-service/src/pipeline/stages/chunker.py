from typing import List
import uuid
from src.models.document import KnowledgeRepresentation, NodeType
from src.models.chunk import Chunk

class ChunkGenerator:
    """
    Generates text chunks solely from the KnowledgeRepresentation.
    Does not know about the original document format.
    """
    
    def generate(self, representation: KnowledgeRepresentation) -> List[Chunk]:
        chunks = []
        current_chunk_nodes = []
        current_text = []
        
        # Simple chunking: group everything under a heading until the next heading.
        for node in representation.nodes:
            if node.type == NodeType.HEADING and current_text:
                # Commit the current chunk
                chunks.append(Chunk(
                    chunk_id=uuid.uuid4().hex,
                    content="\n\n".join(current_text),
                    chunk_type="text",
                    node_refs=[n.id for n in current_chunk_nodes],
                    level=3,
                    assets=representation.assets
                ))
                current_chunk_nodes = []
                current_text = []
                
            current_chunk_nodes.append(node)
            if node.content:
                current_text.append(node.content)
                
        # Commit the last chunk
        if current_text:
            chunks.append(Chunk(
                chunk_id=uuid.uuid4().hex,
                content="\n\n".join(current_text),
                chunk_type="text",
                node_refs=[n.id for n in current_chunk_nodes],
                level=3,
                assets=representation.assets
            ))
            
        return chunks
