CREATE TABLE public.document_nodes (
    id TEXT PRIMARY KEY,
    document_id INTEGER REFERENCES public.documents(id) ON DELETE CASCADE,
    node_type VARCHAR(50) NOT NULL,
    content TEXT,
    page_number INTEGER,
    bounding_box JSONB,
    metadata JSONB
);

-- Index for fast lookup by document
CREATE INDEX idx_document_nodes_doc_id ON public.document_nodes(document_id);
