"use client";

import { useState, useEffect, useRef } from "react";
import { Key, Copy, Check, Plus, TerminalSquare, AlertCircle, Upload, FileText, Loader2, ChevronRight, X } from "lucide-react";

export default function ApiDocsPage() {
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newlyGeneratedKey, setNewlyGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedRaw, setCopiedRaw] = useState(false);

  // File Upload State
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [extractedData, setExtractedData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      const res = await fetch("/api/baseparse/keys");
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
      const res = await fetch("/api/baseparse/keys", {
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
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setExtractedData(null);
      setError(null);
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
      const response = await fetch("/api/baseparse/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to extract document");
      setExtractedData(data.extractedData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      
      <section>
        <div className="mb-6">
          <h1 className="font-pixel text-2xl uppercase tracking-wider mb-2">API Access Node</h1>
          <p className="font-mono text-zinc-500 text-xs uppercase tracking-widest">
            Manage your programmatic access keys
          </p>
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

      <section>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Upload Document Section */}
          <div className="border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#050505] p-6">
            <h3 className="font-mono text-sm text-black dark:text-white mb-4 uppercase tracking-widest">1. Test Extraction</h3>
            
            {error && (
              <div className="mb-4 p-3 border border-red-500/30 bg-red-500/10 text-xs text-red-600 dark:text-red-400 font-mono flex items-center justify-between">
                <span>[ERR] {error}</span>
                <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
              </div>
            )}

            {!file ? (
              <div 
                className="flex-1 min-h-[150px] border-2 border-dashed border-zinc-300 dark:border-white/10 flex flex-col items-center justify-center transition-colors cursor-pointer rounded-lg hover:border-zinc-400 dark:hover:border-white/30 hover:bg-zinc-100 dark:hover:bg-white/5"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-6 h-6 text-zinc-500 dark:text-zinc-400 mb-2" />
                <p className="font-pixel text-sm uppercase tracking-wider text-black dark:text-white mb-1">Upload File</p>
                <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">PDF Documents</p>
              </div>
            ) : (
              <div className="flex flex-col justify-center border border-zinc-200 dark:border-white/10 bg-white dark:bg-black p-4 rounded-lg text-center">
                <FileText className="w-8 h-8 text-cyan-600 dark:text-cyan-400 mx-auto mb-3" />
                <h3 className="font-mono text-sm text-black dark:text-white mb-1 break-all line-clamp-1">{file.name}</h3>
                <p className="font-mono text-xs text-zinc-500 uppercase tracking-widest mb-4">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                
                <div className="flex gap-2">
                  <button onClick={clearFile} className="flex-1 text-zinc-500 hover:text-red-600 dark:hover:text-red-400 font-mono text-xs uppercase tracking-widest transition-colors py-2 border border-zinc-200 dark:border-white/10 rounded">
                    Clear
                  </button>
                  <button 
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="flex-[2] bg-[#014b5c] dark:bg-cyan-500 hover:bg-[#013b4c] dark:hover:bg-cyan-400 text-white dark:text-black py-2 rounded font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 uppercase tracking-widest text-[10px]"
                  >
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Extract"}
                  </button>
                </div>
              </div>
            )}
            <input type="file" accept="application/pdf" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
          </div>

          {/* cURL Section */}
          <div className="border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#050505] p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 blur-[50px] rounded-full pointer-events-none" />
            <h3 className="font-mono text-sm text-black dark:text-white mb-4 uppercase tracking-widest flex items-center gap-2">
              <TerminalSquare className="w-4 h-4 text-violet-400" />
              REST API Integration
            </h3>
            <p className="font-mono text-xs text-zinc-400 mb-4">Send a multipart/form-data request containing your PDF document to our extraction engine.</p>
            
            <div className="bg-white dark:bg-black border border-zinc-200 dark:border-white/10 p-4 relative z-10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 font-mono text-[10px] uppercase border border-green-500/50">POST</span>
                  <span className="font-mono text-[10px] text-zinc-800 dark:text-zinc-300">https://api.baseparse.com/v1/extract</span>
                </div>
                <button 
                  onClick={() => copyToClipboard(`curl -X POST https://api.baseparse.com/v1/extract \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "file=@/path/to/your/invoice.pdf"`, false)}
                  className="text-zinc-500 hover:text-white transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <pre className="font-mono text-[10px] text-zinc-800 dark:text-zinc-300 overflow-x-auto">
{`curl -X POST https://api.baseparse.com/v1/extract \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "file=@/path/to/your/invoice.pdf"`}
              </pre>
            </div>
          </div>
        </div>

        {/* Output JSON Format */}
        <div className="border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#050505] p-6">
          <h3 className="font-mono text-sm text-black dark:text-white mb-4 uppercase tracking-widest">2. Output JSON Format</h3>
          <div className="bg-white dark:bg-black border border-zinc-200 dark:border-white/10 p-4 rounded-lg">
            <pre className="font-mono text-[10px] sm:text-xs text-[#014b5c] dark:text-cyan-400 overflow-x-auto max-h-[400px] custom-scrollbar">
{extractedData ? JSON.stringify(extractedData, null, 2) : `{
  "documentId": "doc_12345abcde",
  "status": "SUCCESS",
  "pagesProcessed": 3,
  "content": [
    {
      "page": 1,
      "text": "Invoice #1024\\nTotal: $450.00",
      "key_value_pairs": {
        "InvoiceNumber": "1024",
        "Total": "$450.00"
      }
    }
  ]
}`}
            </pre>
          </div>
        </div>
      </section>
    </div>
  );
}
