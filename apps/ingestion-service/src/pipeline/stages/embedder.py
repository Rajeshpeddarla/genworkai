from typing import List, Dict, Any
from src.models.chunk import Chunk
from fastembed import TextEmbedding

class EmbeddingGenerator:
    """
    Generates embeddings for chunks using FastEmbed (CPU optimized).
    """
    def __init__(self):
        # Loads ONNX model (downloads if not present)
        self.model = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")

    def embed(self, chunks: List[Chunk]) -> List[Dict[str, Any]]:
        if not chunks:
            return []
            
        texts = [chunk.content for chunk in chunks]
        
        # FastEmbed returns a generator of numpy arrays
        embeddings = list(self.model.embed(texts))
        
        results = []
        for chunk, vector in zip(chunks, embeddings):
            results.append({
                "chunk_id": chunk.chunk_id,
                "vector": vector.tolist(),
                "model": "BAAI/bge-small-en-v1.5"
            })
            
        return results
