"use client";

import { useState, useEffect, useRef } from "react";
import { Key, Copy, Check, Plus, TerminalSquare, AlertCircle, Upload, FileText, Loader2, ChevronRight, X, Play, Lock } from "lucide-react";
import { useMockData } from "../../MockProvider";
import { RequestLogsTable } from "./RequestLogsTable";

export default function ApiDocsPage() {
  // Dynamic plan fetching
  const [currentPlanName, setCurrentPlanName] = useState<string>("Loading...");
  const isPro = currentPlanName.toLowerCase() === 'pro' || currentPlanName.toLowerCase() === 'enterprise';
  const isEnterprise = currentPlanName.toLowerCase() === 'enterprise';

  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newlyGeneratedKey, setNewlyGeneratedKey] = useState<string | null>(null);
  const [copiedRaw, setCopiedRaw] = useState(false);
  const [copiedDoc, setCopiedDoc] = useState(false);
  const [copiedOcr, setCopiedOcr] = useState(false);
  const [copiedChunks, setCopiedChunks] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [copiedLayout, setCopiedLayout] = useState(false);

  const copyDocResponse = () => {
    const text = error ? "[ERROR] " + error : extractedData ? JSON.stringify(extractedData, null, 2) : defaultJsonSchema;
    navigator.clipboard.writeText("```json\n" + text + "\n```");
    setCopiedDoc(true);
    setTimeout(() => setCopiedDoc(false), 2000);
  };

  const copyOcrResponse = () => {
    const text = apiStates.ocr.error ? "[ERROR] " + apiStates.ocr.error : JSON.stringify(apiStates.ocr.data, null, 2);
    navigator.clipboard.writeText("```json\n" + text + "\n```");
    setCopiedOcr(true);
    setTimeout(() => setCopiedOcr(false), 2000);
  };

  const copyLayoutResponse = () => {
    const text = apiStates.layout.error ? "[ERROR] " + apiStates.layout.error : JSON.stringify(apiStates.layout.data, null, 2);
    navigator.clipboard.writeText("```json\n" + text + "\n```");
    setCopiedLayout(true);
    setTimeout(() => setCopiedLayout(false), 2000);
  };

  const copyChunksResponse = () => {
    const text = apiStates.chunks.error ? "[ERROR] " + apiStates.chunks.error : JSON.stringify(apiStates.chunks.data, null, 2);
    navigator.clipboard.writeText("```json\n" + text + "\n```");
    setCopiedChunks(true);
    setTimeout(() => setCopiedChunks(false), 2000);
  };

  const copyEmbedResponse = () => {
    const text = apiStates.embed.error ? "[ERROR] " + apiStates.embed.error : JSON.stringify(apiStates.embed.data, null, 2);
    navigator.clipboard.writeText("```json\n" + text + "\n```");
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2000);
  };

  // File Upload State
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [extractedData, setExtractedData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // API Responses State
  const [apiStates, setApiStates] = useState<Record<string, any>>({
    ocr: { loading: false, data: null, error: null },
    layout: { loading: false, data: null, error: null },
    chunks: { loading: false, data: null, error: null },
    embed: { loading: false, data: null, error: null },
  });

  useEffect(() => {
    fetchKeys();
    fetchPlan();
  }, []);

  const fetchPlan = async () => {
    try {
      const res = await fetch("/api/pricing");
      const data = await res.json();
      if (data.plans && data.currentPlanId) {
        const plan = data.plans.find((p: any) => p.id === data.currentPlanId);
        if (plan) setCurrentPlanName(plan.name);
      } else {
        setCurrentPlanName("Free");
      }
    } catch (e) {
      setCurrentPlanName("Free");
    }
  };

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
        layout: { loading: false, data: null, error: null },
        chunks: { loading: false, data: null, error: null },
        embed: { loading: false, data: null, error: null },
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
      let data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to extract document");
      
      // Poll if queued
      if (data.status === 'queued' && data.job_id) {
          let attempts = 0;
          while (attempts < 60) {
              await new Promise(resolve => setTimeout(resolve, 2000));
              const pollRes = await fetch(`/api/v1/jobs/${data.job_id}`);
              const pollData = await pollRes.json();
              
              if (pollData.status === 'completed' || pollData.status === 'completed_with_errors') {
                  data = pollData;
                  break;
              } else if (pollData.status === 'error') {
                  throw new Error(pollData.error || "Job processing failed");
              }
              attempts++;
          }
      }
      
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
      let data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "API Request Failed");
      
      // Poll if queued
      if (data.status === 'queued' && data.job_id) {
          let attempts = 0;
          while (attempts < 60) {
              await new Promise(resolve => setTimeout(resolve, 2000));
              const pollRes = await fetch(`/api/v1/jobs/${data.job_id}`);
              const pollData = await pollRes.json();
              
              if (pollData.status === 'completed' || pollData.status === 'completed_with_errors') {
                  data = pollData.extractedData || pollData;
                  break;
              } else if (pollData.status === 'error') {
                  throw new Error(pollData.error || "Job processing failed");
              }
              attempts++;
          }
      }
      
      setApiStates(prev => ({ ...prev, [stateKey]: { loading: false, data, error: null } }));
    } catch (err: any) {
      setApiStates(prev => ({ ...prev, [stateKey]: { loading: false, data: null, error: err.message } }));
    }
  };

  const defaultJsonSchema = `{
  "job_id": "job_123",
  "status": "completed",
  "progress": 100,
  "stage": "Completed",
  "extractedData": {
    "job": {
      "id": "job_123",
      "status": "completed",
      "created_at": "2026-08-03T18:14:54.581Z",
      "completed_at": "2026-08-03T18:16:36.635Z"
    },
    "pages": [
      {
        "dpi": 300,
        "width": 2480,
        "height": 3509,
        "elements": [
          {
            "id": "heading_p1_001",
            "type": "heading",
            "bbox": [145, 245, 855, 285],
            "bbox_normalized": {
              "x": 0.0585,
              "y": 0.0698,
              "width": 0.2863,
              "height": 0.0114
            },
            "text": "ENGLISH GRAMMAR FOR IBPS PO",
            "style": {
              "alignment": "left",
              "font_size": 24,
              "font_weight": "bold"
            },
            "confidence": 0.99,
            "reading_order": 1,
            "parent_id": null
          },
          {
            "id": "table_p1_002",
            "type": "table",
            "bbox": [200, 300, 800, 500],
            "bbox_normalized": {
              "x": 0.0806,
              "y": 0.0855,
              "width": 0.2419,
              "height": 0.0570
            },
            "rows": 3,
            "columns": 4,
            "text": "Table content extracted here...",
            "confidence": 0.96,
            "reading_order": 2,
            "parent_id": null
          }
        ],
        "assets": [
          {
            "id": "image_p1_001",
            "bbox": [400, 600, 800, 900],
            "bbox_normalized": {
              "x": 0.1612,
              "y": 0.1710,
              "width": 0.1612,
              "height": 0.0855
            },
            "url": "https://signed-s3-url.com/asset_123.png"
          }
        ]
      }
    ],
    "sections": [
      {
        "title": "ENGLISH GRAMMAR FOR IBPS PO",
        "elements": ["heading_p1_001", "table_p1_002"]
      }
    ],
    "warnings": []
  },
  "usage": {
    "pages_processed": 1,
    "input_tokens": 1500,
    "output_tokens": 500
  }
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
            <span className="font-pixel text-cyan-400 uppercase">{currentPlanName}</span>
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
        
        <RequestLogsTable limit={2} />
      </section>



      <section className="border-t border-zinc-200 dark:border-white/10 pt-12">
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
                <h3 className="font-mono text-sm font-bold text-black dark:text-white flex items-center gap-2">
                  /v1/parse (Doc Intelligence)
                  <span className="text-[10px] text-zinc-500 font-normal ml-2 hidden sm:inline-block border border-zinc-200 dark:border-white/10 px-1.5 py-0.5 bg-black/5 dark:bg-white/5 rounded">Async / Webhooks Recommended</span>
                </h3>
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
                <div className="bg-white dark:bg-black border border-zinc-200 dark:border-white/10 p-4 rounded-lg relative">
                  <button 
                    onClick={copyDocResponse}
                    className="absolute top-2 right-2 p-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-[#0a0a0a] dark:hover:bg-[#111111] border border-zinc-200 dark:border-white/10 rounded-md transition-colors"
                  >
                    {copiedDoc ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
                  </button>
                  <pre className="font-mono text-[10px] sm:text-xs text-[#014b5c] dark:text-cyan-400 overflow-x-auto max-h-[300px] custom-scrollbar pr-8">
                    {error ? "[ERROR] " + error : extractedData ? JSON.stringify(extractedData, null, 2) : defaultJsonSchema}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Layout API */}
          <div className="border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#050505] overflow-hidden">
            <div className="p-4 border-b border-zinc-200 dark:border-white/10 bg-black/5 dark:bg-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="px-2 py-1 bg-green-500/20 text-green-400 font-mono text-[10px] uppercase border border-green-500/50">POST</span>
                <h3 className="font-mono text-sm font-bold text-black dark:text-white flex items-center gap-2">
                  /v1/layout (Premium Layout Extraction)
                  <span className="text-[10px] text-zinc-500 font-normal ml-2 hidden sm:inline-block border border-zinc-200 dark:border-white/10 px-1.5 py-0.5 bg-black/5 dark:bg-white/5 rounded">Async / Webhooks Recommended</span>
                </h3>
              </div>
              <button 
                onClick={() => runApi('/api/v1/layout', 'layout', null, true)}
                disabled={!file || apiStates.layout.loading}
                className="bg-[#014b5c] dark:bg-cyan-500 hover:bg-[#013b4c] dark:hover:bg-cyan-400 text-white dark:text-black px-4 py-2 rounded-md font-bold flex items-center gap-2 transition-colors disabled:opacity-50 uppercase tracking-widest text-xs"
              >
                {apiStates.layout.loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                Run
              </button>
            </div>
            <div className="p-4 bg-zinc-100 dark:bg-[#020202]">
              <p className="font-mono text-xs text-zinc-500 mb-2">Request Body (multipart/form-data):</p>
              <pre className="font-mono text-[10px] text-zinc-400">file: {file ? file.name : "<No file selected>"}</pre>
            </div>
            {(apiStates.layout.data || apiStates.layout.error) && (
              <div className="p-4 border-t border-zinc-200 dark:border-white/10">
                <p className="font-mono text-xs text-zinc-500 mb-2">JSON Response:</p>
                <div className="bg-white dark:bg-black border border-zinc-200 dark:border-white/10 p-4 rounded-lg mb-4 relative">
                  <button 
                    onClick={copyLayoutResponse}
                    className="absolute top-2 right-2 p-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-[#0a0a0a] dark:hover:bg-[#111111] border border-zinc-200 dark:border-white/10 rounded-md transition-colors"
                  >
                    {copiedLayout ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
                  </button>
                  <pre className="font-mono text-[10px] sm:text-xs text-[#014b5c] dark:text-cyan-400 overflow-x-auto max-h-[300px] custom-scrollbar whitespace-pre-wrap pr-8">
                    {apiStates.layout.error ? "[ERROR] " + apiStates.layout.error : JSON.stringify(apiStates.layout.data, null, 2)}
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
                <div className="bg-white dark:bg-black border border-zinc-200 dark:border-white/10 p-4 rounded-lg mb-4 relative">
                  <button 
                    onClick={copyOcrResponse}
                    className="absolute top-2 right-2 p-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-[#0a0a0a] dark:hover:bg-[#111111] border border-zinc-200 dark:border-white/10 rounded-md transition-colors"
                  >
                    {copiedOcr ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
                  </button>
                  <pre className="font-mono text-[10px] sm:text-xs text-[#014b5c] dark:text-cyan-400 overflow-x-auto max-h-[300px] custom-scrollbar whitespace-pre-wrap pr-8">
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
          <div className="border border-zinc-200 dark:border-blue-500/30 bg-zinc-50 dark:bg-[#050505] overflow-hidden shadow-[0_0_15px_rgba(59,130,246,0.05)] relative">
            {!isPro && (
              <div className="absolute inset-0 bg-zinc-50/50 dark:bg-black/50 backdrop-blur-[1px] z-20 flex flex-col items-center justify-center border border-zinc-200 dark:border-white/10 rounded-lg">
                <Lock className="w-8 h-8 text-blue-500 mb-2" />
                <p className="font-mono text-sm text-black dark:text-white uppercase tracking-widest font-bold">Pro Plan Required</p>
                <p className="font-mono text-xs text-zinc-500 mt-1 max-w-[250px] text-center">Upgrade your plan to unlock the Semantic Chunks API.</p>
              </div>
            )}
            <div className={`p-4 border-b border-zinc-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-950/10 flex items-center justify-between ${!isPro ? 'opacity-50' : ''}`}>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-400 font-mono text-[10px] uppercase border border-blue-500/50">POST</span>
                  <h3 className="font-mono text-sm font-bold text-black dark:text-blue-400">/v1/chunks (Semantic Chunking)</h3>
                  <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 font-mono text-[8px] uppercase border border-blue-500/30 rounded-full">Pro+</span>
                </div>
                <button 
                  onClick={() => {
                    let text = "Example text...";
                    if (apiStates.ocr.data?.text) {
                      text = apiStates.ocr.data.text.substring(0, 5000);
                    } else if (extractedData) {
                      text = (extractedData.pages || []).flatMap((p: any) => (p.blocks || []).map((b: any) => b.text)).filter(Boolean).join(" ").substring(0, 5000);
                    }
                    runApi('/api/v1/chunks', 'chunks', { text })
                  }}
                  disabled={!file || apiStates.chunks.loading || (!extractedData && !apiStates.ocr.data)}
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
                  <div className="bg-white dark:bg-black border border-zinc-200 dark:border-white/10 p-4 rounded-lg relative">
                    <button 
                      onClick={copyChunksResponse}
                      className="absolute top-2 right-2 p-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-[#0a0a0a] dark:hover:bg-[#111111] border border-zinc-200 dark:border-white/10 rounded-md transition-colors"
                    >
                      {copiedChunks ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
                    </button>
                    <pre className="font-mono text-[10px] sm:text-xs text-blue-400 overflow-x-auto max-h-[300px] custom-scrollbar whitespace-pre-wrap pr-8">
                      {apiStates.chunks.error ? "[ERROR] " + apiStates.chunks.error : JSON.stringify(apiStates.chunks.data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>

          {/* EMBED API (Pro+) */}
          <div className="border border-zinc-200 dark:border-blue-500/30 bg-zinc-50 dark:bg-[#050505] overflow-hidden shadow-[0_0_15px_rgba(59,130,246,0.05)] relative">
            {!isPro && (
              <div className="absolute inset-0 bg-zinc-50/50 dark:bg-black/50 backdrop-blur-[1px] z-20 flex flex-col items-center justify-center border border-zinc-200 dark:border-white/10 rounded-lg">
                <Lock className="w-8 h-8 text-blue-500 mb-2" />
                <p className="font-mono text-sm text-black dark:text-white uppercase tracking-widest font-bold">Pro Plan Required</p>
                <p className="font-mono text-xs text-zinc-500 mt-1 max-w-[250px] text-center">Upgrade your plan to unlock the Vector Embeddings API.</p>
              </div>
            )}
            <div className={`p-4 border-b border-zinc-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-950/10 flex items-center justify-between ${!isPro ? 'opacity-50' : ''}`}>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-400 font-mono text-[10px] uppercase border border-blue-500/50">POST</span>
                  <h3 className="font-mono text-sm font-bold text-black dark:text-blue-400">/v1/embed (Vector Embeddings)</h3>
                  <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 font-mono text-[8px] uppercase border border-blue-500/30 rounded-full">Pro+</span>
                </div>
                <button 
                  onClick={() => {
                    let chunksPayload = [{ content: "example chunk 1", metadata: {} }, { content: "example chunk 2", metadata: {} }];
                    if (apiStates.chunks.data?.chunks?.length > 0) {
                      chunksPayload = apiStates.chunks.data.chunks.slice(0, 3).map((c: string) => ({ content: c, metadata: {} }));
                    }
                    runApi('/api/v1/embed', 'embed', { chunks: chunksPayload })
                  }}
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
  "chunks": [
    { "content": "example chunk 1", "metadata": {} },
    { "content": "example chunk 2", "metadata": {} }
  ]
}`}
                </pre>
              </div>
              {(apiStates.embed.data || apiStates.embed.error) && (
                <div className="p-4 border-t border-zinc-200 dark:border-white/10">
                  <p className="font-mono text-xs text-zinc-500 mb-2">Response:</p>
                  <div className="bg-white dark:bg-black border border-zinc-200 dark:border-white/10 p-4 rounded-lg relative">
                    <button 
                      onClick={copyEmbedResponse}
                      className="absolute top-2 right-2 p-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-[#0a0a0a] dark:hover:bg-[#111111] border border-zinc-200 dark:border-white/10 rounded-md transition-colors"
                    >
                      {copiedEmbed ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
                    </button>
                    <pre className="font-mono text-[10px] sm:text-xs text-blue-400 overflow-x-auto max-h-[300px] custom-scrollbar pr-8">
                      {apiStates.embed.error ? "[ERROR] " + apiStates.embed.error : JSON.stringify(apiStates.embed.data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>



        </div>
      </section>
    </div>
  );
}
