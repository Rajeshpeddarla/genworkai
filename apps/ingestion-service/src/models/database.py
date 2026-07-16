from sqlalchemy import Column, Integer, String, JSON, DateTime, ForeignKey, Boolean, Numeric, Text
from sqlalchemy.orm import declarative_base
from pgvector.sqlalchemy import Vector

Base = declarative_base()

class Document(Base):
    __tablename__ = 'documents'
    
    id = Column(Integer, primary_key=True)
    kb_id = Column(Integer)
    source_id = Column(Integer)
    title = Column(String(255), nullable=False)
    source_type = Column(String(50), nullable=False)
    source_url = Column(Text)
    mime_type = Column(String(100))
    storage_key = Column(Text)
    storage_provider = Column(String(50), default='local')
    
    status = Column(String(50), default='uploaded')
    content = Column(Text)
    metadata_json = Column("metadata", JSON)
    
    # Versioning
    storage_version = Column(Integer, default=1)
    extraction_version = Column(Integer, default=0)
    chunking_version = Column(Integer, default=0)
    embedding_version = Column(Integer, default=0)

class DocumentNode(Base):
    """
    New table for storing reusable KnowledgeNodes (Paragraphs, Headings, Images, Formulas).
    """
    __tablename__ = 'document_nodes'
    
    id = Column(String(100), primary_key=True)
    document_id = Column(Integer, ForeignKey('documents.id', ondelete='CASCADE'))
    node_type = Column(String(50), nullable=False) # 'heading', 'paragraph', 'image', 'formula'
    content = Column(Text)
    page_number = Column(Integer)
    bounding_box = Column(JSON) # [x, y, w, h]
    metadata_json = Column("metadata", JSON)

class DocumentArtifact(Base):
    __tablename__ = 'document_artifacts'
    
    id = Column(Integer, primary_key=True)
    document_id = Column(Integer, ForeignKey('documents.id', ondelete='CASCADE'))
    page_number = Column(Integer)
    type = Column(String(50), nullable=False) # 'figure', 'table', 'equation'
    identifier = Column(String(100))
    content = Column(Text)
    storage_key = Column(Text)
    bounding_box = Column(JSON)

class DocumentChunk(Base):
    __tablename__ = 'document_chunks'
    
    id = Column(Integer, primary_key=True)
    document_id = Column(Integer, ForeignKey('documents.id', ondelete='CASCADE'))
    parent_id = Column(Integer)
    level = Column(Integer, default=3)
    chunk_type = Column(String(50))
    content = Column(Text, nullable=False)
    page_number = Column(Integer)
    bounding_box = Column(JSON)
    artifact_refs = Column(JSON) # To be renamed or used as node_refs
    assets = Column(JSON) # Contains base64 extracted diagrams and assets
    hash = Column(String(64))

class DocumentEmbedding(Base):
    __tablename__ = 'document_embeddings'
    
    id = Column(Integer, primary_key=True)
    document_id = Column(Integer, ForeignKey('documents.id', ondelete='CASCADE'))
    chunk_id = Column(Integer, ForeignKey('document_chunks.id', ondelete='CASCADE'))
    model = Column(String(100), default='BAAI/bge-small-en-v1.5')
    vector = Column(Vector(384))

class DocumentProcessingLog(Base):
    __tablename__ = 'document_processing_logs'
    
    id = Column(Integer, primary_key=True)
    document_id = Column(Integer, ForeignKey('documents.id', ondelete='CASCADE'))
    stage = Column(String(50), nullable=False)
    status = Column(String(50), nullable=False)
    message = Column(Text)
    metrics = Column(JSON)
