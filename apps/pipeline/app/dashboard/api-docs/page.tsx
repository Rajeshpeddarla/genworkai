"use client";

import { useState, useEffect, useRef } from "react";
import { Key, Copy, Check, Plus, TerminalSquare, AlertCircle, Upload, FileText, Loader2, ChevronRight, X, Play } from "lucide-react";
import { useMockData } from "../../MockProvider";

export default function ApiDocsPage() {
  const { currentPlan } = useMockData();
  const isPro = currentPlan === 'pro' || currentPlan === 'enterprise';
  const isEnterprise = currentPlan === 'enterprise';

  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newlyGeneratedKey, setNewlyGeneratedKey] = useState<string | null>(null);
  const [copiedRaw, setCopiedRaw] = useState(false);

  // File Upload State
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [extractedData, setExtractedData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // API Responses State
  const [apiStates, setApiStates] = useState<Record<string, any>>({
    ocr: { loading: false, data: null, error: null },
    chunks: { loading: false, data: null, error: null },
    embed: { loading: false, data: null, error: null },
    search: { loading: false, data: null, error: null },
  });

  const [searchQuery, setSearchQuery] = useState("Revenue Q3");

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      const res = await fetch("/api/v1/keys");
      const data = await res.json();
      if (data.keys) {
        setKeys(data.keys);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/v1/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: `Node Key ${new Date().toLocaleDateString()}` })
      });
      const data = await res.json();
      
      if (data.rawKey) {
        setNewlyGeneratedKey(data.rawKey);
        setKeys([data.key, ...keys]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = (text: string, isRaw: boolean) => {
    navigator.clipboard.writeText(text);
    if (isRaw) {
      setCopiedRaw(true);
      setTimeout(() => setCopiedRaw(false), 2000);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setExtractedData(null);
      setError(null);
      setApiStates({
        ocr: { loading: false, data: null, error: null },
        chunks: { loading: false, data: null, error: null },
        embed: { loading: false, data: null, error: null },
        search: { loading: false, data: null, error: null },
      });
    }
  };

  const clearFile = () => {
    setFile(null);
    setExtractedData(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/v1/parse", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to extract document");
      setExtractedData(data.extractedData || data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const runApi = async (endpoint: string, stateKey: string, bodyObj?: any, isFormData = false) => {
    if (!file) {
      setApiStates(prev => ({ ...prev, [stateKey]: { ...prev[stateKey], error: "Upload a document first" }}));
      return;
    }
    
    setApiStates(prev => ({ ...prev, [stateKey]: { loading: true, data: null, error: null } }));
    
    try {
      let options: RequestInit = { method: "POST" };
      
      if (isFormData) {
        const formData = new FormData();
        formData.append("file", file);
        options.body = formData;
      } else {
        options.headers = { "Content-Type": "application/json" };
        options.body = JSON.stringify(bodyObj);
      }

      const res = await fetch(endpoint, options);
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "API Request Failed");
      
      setApiStates(prev => ({ ...prev, [stateKey]: { loading: false, data, error: null } }));
    } catch (err: any) {
      setApiStates(prev => ({ ...prev, [stateKey]: { loading: false, data: null, error: err.message } }));
    }
  };

  const defaultJsonSchema = `{
  "document": {
    "id": "doc_123",
    "title": "Document Title",
    "pages": 1,
    "checksum": "sha256..."
  },
  "metadata": {
    "author": "Author Name"
  },
  "pages": [
    {
      "page": 1,
      "width": 1000,
      "height": 1000,
      "blocks": [
        {
          "id": "paragraph_001",
          "type": "paragraph",
          "text": "A binary search tree stores values in sorted order...",
          "bbox": [120, 280, 1900, 640]
        },
        {
          "id": "diagram_001",
          "type": "diagram",
          "caption": "Figure 2",
          "description": "Binary search tree containing root node 8",
          "image_url": "https://.../diagram_001.png",
          "bbox": [200, 700, 1800, 1800]
        }
      ]
    }
  ],
  "chunks": [],
  "embeddings": []
}`;

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      
      <section>
        <div className="mb-6 flex justify-between items-end">
          <div>
            <h1 className="font-pixel text-2xl uppercase tracking-wider mb-2">API Access Node</h1>
            <p className="font-mono text-zinc-500 text-xs uppercase tracking-widest">
              Manage your programmatic access keys
            </p>
          </div>
          <div className="text-right">
            <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">Current Plan: </span>
            <span className="font-pixel text-cyan-400 uppercase">{currentPlan}</span>
          </div>
        </div>

        <div className="space-y-4">
          {newlyGeneratedKey && (
            <div className="border border-cyan-500/50 bg-cyan-50 dark:bg-cyan-500/10 p-6 relative overflow-hidden">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-cyan-600 dark:text-cyan-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-mono text-sm text-cyan-600 dark:text-cyan-400 font-bold mb-2 uppercase tracking-widest">Store this key securely</h4>
                  <p className="font-mono text-xs text-zinc-400 mb-4">This is the only time the raw API key will be displayed. If you lose it, you will need to generate a new one.</p>
                  
                  <div className="flex items-center gap-2 bg-white dark:bg-black border border-zinc-200 dark:border-white/10 p-2">
                    <code className="flex-1 font-mono text-sm text-black dark:text-white break-all px-2">{newlyGeneratedKey}</code>
                    <button 
                      onClick={() => copyToClipboard(newlyGeneratedKey, true)}
                      className="p-2 hover:bg-white/10 transition-colors shrink-0"
                    >
                      {copiedRaw ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-zinc-400" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#050505]">
            <div className="p-4 border-b border-zinc-200 dark:border-white/10 bg-black/5 dark:bg-white/5 flex justify-between items-center">
              <h3 className="font-mono text-sm uppercase tracking-widest text-black dark:text-white font-bold">API Keys</h3>
              <button 
                onClick={handleCreateKey}
                disabled={creating}
                className="bg-[#014b5c] dark:bg-cyan-500 hover:bg-[#013b4c] dark:hover:bg-cyan-400 text-white dark:text-black px-4 py-2 rounded-md font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 uppercase tracking-widest text-xs"
              >
                <Plus className="w-4 h-4" />
                {creating ? "Generating..." : "Create New API Key"}
              </button>
            </div>
            
            <div className="divide-y divide-zinc-200 dark:divide-white/10">
              {loading ? (
                <div className="p-8 text-center font-mono text-xs text-zinc-500 uppercase">Fetching keys...</div>
              ) : keys.length === 0 ? (
                <div className="p-8 text-center font-mono text-xs text-zinc-500 uppercase">No active keys found</div>
              ) : (
                keys.map((key) => (
                  <div key={key.id} className="p-4 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-4">
                      <Key className="w-4 h-4 text-zinc-500" />
                      <div>
                        <div className="font-mono text-sm text-black dark:text-white">{key.name}</div>
                        <div className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest mt-1">
                          Created: {new Date(key.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="font-mono text-xs text-zinc-500 dark:text-zinc-400 bg-white dark:bg-black px-3 py-1 border border-zinc-200 dark:border-white/10">
                      {key.key_prefix}****************
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 pt-12">
        <div className="mb-6 text-center max-w-2xl mx-auto">
          <h1 className="font-pixel text-2xl uppercase tracking-wider mb-4">API Playground</h1>
          <p className="font-mono text-zinc-500 text-xs uppercase tracking-widest">
            Upload a document to enable interactive testing of the Document Intelligence pipelines.
          </p>
        </div>

        {/* 1. Upload Document Section */}
        <div className="border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#050505] p-6 max-w-2xl mx-auto mb-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-[50px] rounded-full pointer-events-none" />
          <h3 className="font-mono text-sm text-black dark:text-white mb-4 uppercase tracking-widest">1. Set Target Document</h3>
          
          {error && (
            <div className="mb-4 p-3 border border-red-500/30 bg-red-500/10 text-xs text-red-600 dark:text-red-400 font-mono flex items-center justify-between">
              <span>[ERR] {error}</span>
              <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
            </div>
          )}

          {!file ? (
            <div 
              className="flex-1 min-h-[150px] border-2 border-dashed border-zinc-300 dark:border-white/10 flex flex-col items-center justify-center transition-colors cursor-pointer rounded-lg hover:border-zinc-400 dark:hover:border-white/30 hover:bg-zinc-100 dark:hover:bg-white/5 relative z-10"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-6 h-6 text-zinc-500 dark:text-zinc-400 mb-2" />
              <p className="font-pixel text-sm uppercase tracking-wider text-black dark:text-white mb-1">Upload File</p>
              <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">PDF Documents</p>
            </div>
          ) : (
            <div className="flex flex-col justify-center border border-zinc-200 dark:border-white/10 bg-white dark:bg-black p-4 rounded-lg text-center relative z-10">
              <FileText className="w-8 h-8 text-cyan-600 dark:text-cyan-400 mx-auto mb-3" />
              <h3 className="font-mono text-sm text-black dark:text-white mb-1 break-all line-clamp-1">{file.name}</h3>
              <p className="font-mono text-xs text-zinc-500 uppercase tracking-widest mb-4">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
              
              <div className="flex gap-2">
                <button onClick={clearFile} className="flex-1 text-zinc-500 hover:text-red-600 dark:hover:text-red-400 font-mono text-xs uppercase tracking-widest transition-colors py-2 border border-zinc-200 dark:border-white/10 rounded">
                  Clear
                </button>
              </div>
            </div>
          )}
          <input type="file" accept="application/pdf" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
        </div>

        {/* 2. Endpoints */}
        <div className="space-y-8">
          
          {/* Parse API */}
          <div className="border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#050505] overflow-hidden">
            <div className="p-4 border-b border-zinc-200 dark:border-white/10 bg-black/5 dark:bg-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="px-2 py-1 bg-green-500/20 text-green-400 font-mono text-[10px] uppercase border border-green-500/50">POST</span>
                <h3 className="font-mono text-sm font-bold text-black dark:text-white">/v1/parse (Doc Intelligence)</h3>
              </div>
              <button 
                onClick={handleUpload}
                disabled={!file || isUploading}
                className="bg-[#014b5c] dark:bg-cyan-500 hover:bg-[#013b4c] dark:hover:bg-cyan-400 text-white dark:text-black px-4 py-2 rounded-md font-bold flex items-center gap-2 transition-colors disabled:opacity-50 uppercase tracking-widest text-xs"
              >
                {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                Run
              </button>
            </div>
            <div className="p-4 bg-zinc-100 dark:bg-[#020202]">
              <p className="font-mono text-xs text-zinc-500 mb-2">Request Body (multipart/form-data):</p>
              <pre className="font-mono text-[10px] text-zinc-400">file: {file ? file.name : "<No file selected>"}</pre>
            </div>
            {(extractedData || error) && (
              <div className="p-4 border-t border-zinc-200 dark:border-white/10">
                <p className="font-mono text-xs text-zinc-500 mb-2">Response:</p>
                <div className="bg-white dark:bg-black border border-zinc-200 dark:border-white/10 p-4 rounded-lg">
                  <pre className="font-mono text-[10px] sm:text-xs text-[#014b5c] dark:text-cyan-400 overflow-x-auto max-h-[300px] custom-scrollbar">
                    {error ? "[ERROR] " + error : extractedData ? JSON.stringify(extractedData, null, 2) : defaultJsonSchema}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* OCR API */}
          <div className="border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#050505] overflow-hidden">
            <div className="p-4 border-b border-zinc-200 dark:border-white/10 bg-black/5 dark:bg-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="px-2 py-1 bg-green-500/20 text-green-400 font-mono text-[10px] uppercase border border-green-500/50">POST</span>
                <h3 className="font-mono text-sm font-bold text-black dark:text-white">/v1/ocr (Raw Text Extract)</h3>
              </div>
              <button 
                onClick={() => runApi('/api/v1/ocr', 'ocr', null, true)}
                disabled={!file || apiStates.ocr.loading}
                className="bg-[#014b5c] dark:bg-cyan-500 hover:bg-[#013b4c] dark:hover:bg-cyan-400 text-white dark:text-black px-4 py-2 rounded-md font-bold flex items-center gap-2 transition-colors disabled:opacity-50 uppercase tracking-widest text-xs"
              >
                {apiStates.ocr.loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                Run
              </button>
            </div>
            <div className="p-4 bg-zinc-100 dark:bg-[#020202]">
              <p className="font-mono text-xs text-zinc-500 mb-2">Request Body (multipart/form-data):</p>
              <pre className="font-mono text-[10px] text-zinc-400">file: {file ? file.name : "<No file selected>"}</pre>
            </div>
            {(apiStates.ocr.data || apiStates.ocr.error) && (
              <div className="p-4 border-t border-zinc-200 dark:border-white/10">
                <p className="font-mono text-xs text-zinc-500 mb-2">JSON Response:</p>
                <div className="bg-white dark:bg-black border border-zinc-200 dark:border-white/10 p-4 rounded-lg mb-4">
                  <pre className="font-mono text-[10px] sm:text-xs text-[#014b5c] dark:text-cyan-400 overflow-x-auto max-h-[300px] custom-scrollbar whitespace-pre-wrap">
                    {apiStates.ocr.error ? "[ERROR] " + apiStates.ocr.error : JSON.stringify(apiStates.ocr.data, null, 2)}
                  </pre>
                </div>
                
                {apiStates.ocr.data && apiStates.ocr.data.pages && (
                  <div>
                    <p className="font-mono text-xs text-zinc-500 mb-2 mt-4">Visualizer (Extracted Assets):</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {apiStates.ocr.data.pages.flatMap((page: any) => page.blocks || []).filter((b: any) => b.image_url).map((block: any, idx: number) => (
                        <div key={idx} className="border border-zinc-200 dark:border-white/10 rounded-lg p-2 bg-white dark:bg-[#0a0a0a]">
                          <img src={block.image_url} alt={block.id} className="w-full h-auto object-contain max-h-48 rounded" />
                          <div className="mt-2 flex justify-between items-center px-1">
                            <span className="font-mono text-[10px] text-zinc-500">{block.type.toUpperCase()}</span>
                            <a href={block.image_url} target="_blank" rel="noreferrer" className="text-[10px] text-blue-500 hover:underline">View Original</a>
                          </div>
                        </div>
                      ))}
                      {apiStates.ocr.data.pages.flatMap((page: any) => page.blocks || []).filter((b: any) => b.image_url).length === 0 && (
                        <div className="col-span-full p-4 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-lg text-center">
                          <p className="font-mono text-xs text-zinc-500">No physical assets (images, tables, diagrams) were extracted from this document.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* CHUNKS API (Pro+) */}
          {isPro && (
            <div className="border border-zinc-200 dark:border-blue-500/30 bg-zinc-50 dark:bg-[#050505] overflow-hidden shadow-[0_0_15px_rgba(59,130,246,0.05)]">
              <div className="p-4 border-b border-zinc-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-950/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-400 font-mono text-[10px] uppercase border border-blue-500/50">POST</span>
                  <h3 className="font-mono text-sm font-bold text-black dark:text-blue-400">/v1/chunks (Semantic Chunking)</h3>
                  <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 font-mono text-[8px] uppercase border border-blue-500/30 rounded-full">Pro+</span>
                </div>
                <button 
                  onClick={() => runApi('/api/v1/chunks', 'chunks', { text: extractedData ? JSON.stringify(extractedData).substring(0, 500) : "Example text..." })}
                  disabled={!file || apiStates.chunks.loading || !extractedData}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-md font-bold flex items-center gap-2 transition-colors disabled:opacity-50 uppercase tracking-widest text-xs"
                >
                  {apiStates.chunks.loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                  Run
                </button>
              </div>
              <div className="p-4 bg-zinc-100 dark:bg-[#020202]">
                <p className="font-mono text-xs text-zinc-500 mb-2">Request Body (application/json):</p>
                <pre className="font-mono text-[10px] text-zinc-400">
{`{
  "text": "${extractedData ? '...document content...' : 'Please run Parse API first to get document content.'}"
}`}
                </pre>
              </div>
              {(apiStates.chunks.data || apiStates.chunks.error) && (
                <div className="p-4 border-t border-zinc-200 dark:border-white/10">
                  <p className="font-mono text-xs text-zinc-500 mb-2">Response:</p>
                  <div className="bg-white dark:bg-black border border-zinc-200 dark:border-white/10 p-4 rounded-lg">
                    <pre className="font-mono text-[10px] sm:text-xs text-blue-400 overflow-x-auto max-h-[300px] custom-scrollbar">
                      {apiStates.chunks.error ? "[ERROR] " + apiStates.chunks.error : JSON.stringify(apiStates.chunks.data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* EMBED API (Pro+) */}
          {isPro && (
            <div className="border border-zinc-200 dark:border-blue-500/30 bg-zinc-50 dark:bg-[#050505] overflow-hidden shadow-[0_0_15px_rgba(59,130,246,0.05)]">
              <div className="p-4 border-b border-zinc-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-950/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-400 font-mono text-[10px] uppercase border border-blue-500/50">POST</span>
                  <h3 className="font-mono text-sm font-bold text-black dark:text-blue-400">/v1/embed (Vector Embeddings)</h3>
                  <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 font-mono text-[8px] uppercase border border-blue-500/30 rounded-full">Pro+</span>
                </div>
                <button 
                  onClick={() => runApi('/api/v1/embed', 'embed', { documentId: "test_doc_123", chunks: ["example chunk 1", "example chunk 2"] })}
                  disabled={!file || apiStates.embed.loading}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-md font-bold flex items-center gap-2 transition-colors disabled:opacity-50 uppercase tracking-widest text-xs"
                >
                  {apiStates.embed.loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                  Run
                </button>
              </div>
              <div className="p-4 bg-zinc-100 dark:bg-[#020202]">
                <p className="font-mono text-xs text-zinc-500 mb-2">Request Body (application/json):</p>
                <pre className="font-mono text-[10px] text-zinc-400">
{`{
  "documentId": "test_doc_123",
  "chunks": [
    "example chunk 1",
    "example chunk 2"
  ]
}`}
                </pre>
              </div>
              {(apiStates.embed.data || apiStates.embed.error) && (
                <div className="p-4 border-t border-zinc-200 dark:border-white/10">
                  <p className="font-mono text-xs text-zinc-500 mb-2">Response:</p>
                  <div className="bg-white dark:bg-black border border-zinc-200 dark:border-white/10 p-4 rounded-lg">
                    <pre className="font-mono text-[10px] sm:text-xs text-blue-400 overflow-x-auto max-h-[300px] custom-scrollbar">
                      {apiStates.embed.error ? "[ERROR] " + apiStates.embed.error : JSON.stringify(apiStates.embed.data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SEARCH API (Enterprise) */}
          {isEnterprise && (
            <div className="border border-zinc-200 dark:border-violet-500/30 bg-zinc-50 dark:bg-[#050505] overflow-hidden shadow-[0_0_15px_rgba(139,92,246,0.05)]">
              <div className="p-4 border-b border-zinc-200 dark:border-violet-500/20 bg-violet-50 dark:bg-violet-950/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 bg-violet-500/20 text-violet-400 font-mono text-[10px] uppercase border border-violet-500/50">POST</span>
                  <h3 className="font-mono text-sm font-bold text-black dark:text-violet-400">/v1/search (RAG Built-in)</h3>
                  <span className="px-2 py-0.5 bg-violet-500/20 text-violet-400 font-mono text-[8px] uppercase border border-violet-500/30 rounded-full">Enterprise</span>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-black/20 border border-violet-500/30 text-xs px-2 py-1 text-violet-100 placeholder:text-violet-700 outline-none w-32"
                  />
                  <button 
                    onClick={() => runApi('/api/v1/search', 'search', { query: searchQuery, documentId: "test_doc_123" })}
                    disabled={!file || apiStates.search.loading}
                    className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-md font-bold flex items-center gap-2 transition-colors disabled:opacity-50 uppercase tracking-widest text-xs"
                  >
                    {apiStates.search.loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                    Search
                  </button>
                </div>
              </div>
              <div className="p-4 bg-zinc-100 dark:bg-[#020202]">
                <p className="font-mono text-xs text-zinc-500 mb-2">Request Body (application/json):</p>
                <pre className="font-mono text-[10px] text-zinc-400">
{`{
  "query": "${searchQuery}",
  "documentId": "test_doc_123"
}`}
                </pre>
              </div>
              {(apiStates.search.data || apiStates.search.error) && (
                <div className="p-4 border-t border-zinc-200 dark:border-white/10">
                  <p className="font-mono text-xs text-zinc-500 mb-2">Response:</p>
                  <div className="bg-white dark:bg-black border border-zinc-200 dark:border-white/10 p-4 rounded-lg">
                    <pre className="font-mono text-[10px] sm:text-xs text-violet-400 overflow-x-auto max-h-[300px] custom-scrollbar">
                      {apiStates.search.error ? "[ERROR] " + apiStates.search.error : JSON.stringify(apiStates.search.data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </section>
    </div>
  );
}
