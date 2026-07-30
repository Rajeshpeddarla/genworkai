"use client";

import { useState } from "react";
import { Copy, Check, AlertCircle, FileText, FileCode2, Link, Key, Box, Database, Lock } from "lucide-react";

export default function IntegrationGuidePage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const defaultJsonSchema = `{
  "schema_version": "1.0",
  "job": {
    "id": "job_123",
    "status": "completed",
    "created_at": "2026-07-30T08:00:00Z",
    "completed_at": "2026-07-30T08:02:15Z"
  },
  "document": {
    "id": "doc_123",
    "filename": "medical-report.pdf",
    "page_count": 19,
    "document_type": "medical_report",
    "languages": ["en"],
    "processing_time_ms": 135000
  },
  "pages": [
    {
      "page_number": 1,
      "status": "completed",
      "dimensions": { "width": 1000, "height": 1414 },
      "blocks": [
        {
          "id": "page_001_table_001",
          "type": "table",
          "bbox": { "x1": 152, "y1": 70, "x2": 977, "y2": 263 },
          "text": "Patient Information...",
          "confidence": 0.96,
          "reading_order": 1,
          "asset": {
            "status": "available",
            "url": "https://signed-s3-url.com/image.png",
            "mime_type": "image/png"
          }
        }
      ]
    }
  ],
  "usage": {
    "pages_processed": 19,
    "input_tokens": 1500,
    "output_tokens": 500
  }
}`;

  return (
    <div className="space-y-16 animate-in fade-in duration-500 max-w-6xl mx-auto pb-24">
      {/* Header */}
      <section className="border-b border-zinc-200 dark:border-white/10 pb-8">
        <h1 className="font-pixel text-3xl uppercase tracking-wider mb-3">API Reference</h1>
        <p className="font-mono text-zinc-500 text-sm">
          Integrate BaseParse directly into your application using our REST APIs. All endpoints are authenticated via Bearer token and return standard JSON.
        </p>
      </section>

      {/* Global Config */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1 sticky top-8">
          <div className="flex items-center gap-2 mb-2">
            <Key className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <h2 className="font-pixel text-lg uppercase">Authentication</h2>
          </div>
          <p className="font-mono text-xs text-zinc-500 leading-relaxed mb-6">
            Authenticate your API requests by including your secret API key in the Authorization header.
          </p>
          <div className="p-4 border border-red-500/30 bg-red-500/10 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <div>
                <h4 className="font-mono text-sm text-red-500 font-bold uppercase tracking-widest mb-1">Data Retention</h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 font-mono">
                  All extracted assets (images, tables) are automatically purged after 7 days. Download them to your own S3 bucket if you need permanent storage.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="lg:col-span-2">
          <div className="bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 shadow-2xl">
            <div className="flex items-center justify-between px-4 py-2 bg-zinc-950 border-b border-zinc-800">
              <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">HTTP Header</span>
            </div>
            <div className="p-4 overflow-x-auto relative group">
              <button onClick={() => copyToClipboard('Authorization: Bearer <YOUR_API_KEY>', 'auth')} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white/10 rounded hover:bg-white/20">
                {copiedCode === 'auth' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-white" />}
              </button>
              <pre className="font-mono text-xs text-green-400">
                Authorization: Bearer {'<YOUR_API_KEY>'}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* 1. Document Intelligence API */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start pt-16 border-t border-zinc-200 dark:border-white/10">
        <div className="lg:col-span-1 sticky top-8">
          <div className="flex items-center gap-2 mb-2">
            <FileCode2 className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <h2 className="font-pixel text-lg uppercase">Document Intelligence</h2>
          </div>
          <p className="font-mono text-xs text-zinc-500 leading-relaxed mb-4">
            The flagship endpoint. Upload a PDF to instantly extract structured text, markdown tables, diagrams, and cropped images.
          </p>
          <div className="font-mono text-xs bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 p-3 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-zinc-500">Method</span>
              <span className="text-green-600 dark:text-green-400 font-bold">POST</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-zinc-500">Endpoint</span>
              <span className="text-black dark:text-white">/v1/parse</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">Content-Type</span>
              <span className="text-black dark:text-white">multipart/form-data</span>
            </div>
          </div>
        </div>
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 shadow-2xl">
            <div className="flex items-center justify-between px-4 py-2 bg-zinc-950 border-b border-zinc-800">
              <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">cURL Request</span>
            </div>
            <div className="p-4 overflow-x-auto relative group">
              <button onClick={() => copyToClipboard('curl -X POST https://api.baseparse.com/v1/parse \\\n  -H "Authorization: Bearer <YOUR_API_KEY>" \\\n  -F "file=@/path/to/invoice.pdf"', 'parse-req')} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white/10 rounded hover:bg-white/20">
                {copiedCode === 'parse-req' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-white" />}
              </button>
              <pre className="font-mono text-xs text-zinc-300">
                <span className="text-pink-400">curl</span> -X POST https://api.baseparse.com/v1/parse \<br/>
                {'  '}-H <span className="text-green-300">"Authorization: Bearer &lt;YOUR_API_KEY&gt;"</span> \<br/>
                {'  '}-F <span className="text-green-300">"file=@/path/to/invoice.pdf"</span>
              </pre>
            </div>
          </div>

          <div className="bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 shadow-2xl">
            <div className="flex items-center justify-between px-4 py-2 bg-zinc-950 border-b border-zinc-800">
              <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">JSON Response (200 OK)</span>
            </div>
            <div className="p-4 overflow-x-auto relative group">
              <button onClick={() => copyToClipboard(defaultJsonSchema, 'parse-res')} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white/10 rounded hover:bg-white/20">
                {copiedCode === 'parse-res' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-white" />}
              </button>
              <pre className="font-mono text-[10px] sm:text-xs text-cyan-300 custom-scrollbar max-h-96">
                {defaultJsonSchema}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Raw Text Extraction (OCR) */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start pt-16 border-t border-zinc-200 dark:border-white/10">
        <div className="lg:col-span-1 sticky top-8">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <h2 className="font-pixel text-lg uppercase">Raw Text (OCR)</h2>
          </div>
          <p className="font-mono text-xs text-zinc-500 leading-relaxed mb-4">
            A much faster, cheaper endpoint that purely extracts raw text from a PDF without analyzing layout, tables, or images.
          </p>
          <div className="font-mono text-xs bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 p-3 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-zinc-500">Method</span>
              <span className="text-green-600 dark:text-green-400 font-bold">POST</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-zinc-500">Endpoint</span>
              <span className="text-black dark:text-white">/v1/ocr</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">Content-Type</span>
              <span className="text-black dark:text-white">multipart/form-data</span>
            </div>
          </div>
        </div>
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 shadow-2xl">
            <div className="flex items-center justify-between px-4 py-2 bg-zinc-950 border-b border-zinc-800">
              <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">cURL Request</span>
            </div>
            <div className="p-4 overflow-x-auto relative group">
              <button onClick={() => copyToClipboard('curl -X POST https://api.baseparse.com/v1/ocr \\\n  -H "Authorization: Bearer <YOUR_API_KEY>" \\\n  -F "file=@/path/to/invoice.pdf"', 'ocr-req')} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white/10 rounded hover:bg-white/20">
                {copiedCode === 'ocr-req' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-white" />}
              </button>
              <pre className="font-mono text-xs text-zinc-300">
                <span className="text-pink-400">curl</span> -X POST https://api.baseparse.com/v1/ocr \<br/>
                {'  '}-H <span className="text-green-300">"Authorization: Bearer &lt;YOUR_API_KEY&gt;"</span> \<br/>
                {'  '}-F <span className="text-green-300">"file=@/path/to/invoice.pdf"</span>
              </pre>
            </div>
          </div>
          
          <div className="bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 shadow-2xl">
            <div className="flex items-center justify-between px-4 py-2 bg-zinc-950 border-b border-zinc-800">
              <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">JSON Response (200 OK)</span>
            </div>
            <div className="p-4 overflow-x-auto relative group">
              <button onClick={() => copyToClipboard('{\n  "text": "Page 1... Raw extracted text flows continuously here...",\n  "usage": {\n    "pages_extracted_this_month": 150\n  }\n}', 'ocr-res')} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white/10 rounded hover:bg-white/20">
                {copiedCode === 'ocr-res' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-white" />}
              </button>
              <pre className="font-mono text-[10px] sm:text-xs text-cyan-300">
{`{
  "text": "Page 1... Raw extracted text flows continuously here...",
  "usage": {
    "pages_extracted_this_month": 150
  }
}`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Semantic Chunks */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start pt-16 border-t border-zinc-200 dark:border-white/10">
        <div className="lg:col-span-1 sticky top-8">
          <div className="flex items-center gap-2 mb-2">
            <Box className="w-5 h-5 text-blue-500" />
            <h2 className="font-pixel text-lg uppercase text-blue-500">Semantic Chunks</h2>
            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded text-[10px] font-bold">PRO</span>
          </div>
          <p className="font-mono text-xs text-zinc-500 leading-relaxed mb-4">
            Pass long document text into this endpoint and the engine will intelligently split it into logical semantic chunks, perfect for feeding into a Vector Database or LLM context window.
          </p>
          <div className="font-mono text-xs bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 p-3 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-zinc-500">Method</span>
              <span className="text-green-600 dark:text-green-400 font-bold">POST</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-zinc-500">Endpoint</span>
              <span className="text-black dark:text-white">/v1/chunks</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">Content-Type</span>
              <span className="text-black dark:text-white">application/json</span>
            </div>
          </div>
        </div>
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-900 rounded-xl overflow-hidden border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
            <div className="flex items-center justify-between px-4 py-2 bg-blue-950/30 border-b border-blue-500/30">
              <span className="font-mono text-[10px] text-blue-300 uppercase tracking-widest">cURL Request</span>
            </div>
            <div className="p-4 overflow-x-auto relative group">
              <button onClick={() => copyToClipboard('curl -X POST https://api.baseparse.com/v1/chunks \\\n  -H "Authorization: Bearer <YOUR_API_KEY>" \\\n  -H "Content-Type: application/json" \\\n  -d \'{"text": "Extracted long text..."}\'', 'chunks-req')} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white/10 rounded hover:bg-white/20">
                {copiedCode === 'chunks-req' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-white" />}
              </button>
              <pre className="font-mono text-xs text-zinc-300">
                <span className="text-pink-400">curl</span> -X POST https://api.baseparse.com/v1/chunks \<br/>
                {'  '}-H <span className="text-green-300">"Authorization: Bearer &lt;YOUR_API_KEY&gt;"</span> \<br/>
                {'  '}-H <span className="text-green-300">"Content-Type: application/json"</span> \<br/>
                {'  '}-d <span className="text-yellow-300">'{'{"text": "Extracted long text goes here..."}'}'</span>
              </pre>
            </div>
          </div>
          
          <div className="bg-zinc-900 rounded-xl overflow-hidden border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
            <div className="flex items-center justify-between px-4 py-2 bg-blue-950/30 border-b border-blue-500/30">
              <span className="font-mono text-[10px] text-blue-300 uppercase tracking-widest">JSON Response (200 OK)</span>
            </div>
            <div className="p-4 overflow-x-auto relative group">
              <button onClick={() => copyToClipboard('{\n  "chunks": [\n    "Introduction: This is the first logical semantic block...",\n    "Methodology: This is the second logical block..."\n  ]\n}', 'chunks-res')} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white/10 rounded hover:bg-white/20">
                {copiedCode === 'chunks-res' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-white" />}
              </button>
              <pre className="font-mono text-[10px] sm:text-xs text-blue-300">
{`{
  "chunks": [
    "Introduction: This is the first logical semantic block...",
    "Methodology: This is the second logical block..."
  ]
}`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Embeddings API */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start pt-16 border-t border-zinc-200 dark:border-white/10">
        <div className="lg:col-span-1 sticky top-8">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-5 h-5 text-purple-500" />
            <h2 className="font-pixel text-lg uppercase text-purple-500">Vector Embeddings</h2>
            <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded text-[10px] font-bold">PRO</span>
          </div>
          <p className="font-mono text-xs text-zinc-500 leading-relaxed mb-4">
            Pass your chunked strings into this endpoint and we will automatically convert them into high-dimensional vectors and return them. You can optionally pass a <code>documentId</code> to save the vectors into our hosted database for use with our <code>/v1/search</code> API.
          </p>
          <div className="font-mono text-xs bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 p-3 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-zinc-500">Method</span>
              <span className="text-green-600 dark:text-green-400 font-bold">POST</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-zinc-500">Endpoint</span>
              <span className="text-black dark:text-white">/v1/embed</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">Content-Type</span>
              <span className="text-black dark:text-white">application/json</span>
            </div>
          </div>
        </div>
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-900 rounded-xl overflow-hidden border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.1)]">
            <div className="flex items-center justify-between px-4 py-2 bg-purple-950/30 border-b border-purple-500/30">
              <span className="font-mono text-[10px] text-purple-300 uppercase tracking-widest">cURL Request</span>
            </div>
            <div className="p-4 overflow-x-auto relative group">
              <button onClick={() => copyToClipboard('curl -X POST https://api.baseparse.com/v1/embed \\\n  -H "Authorization: Bearer <YOUR_API_KEY>" \\\n  -H "Content-Type: application/json" \\\n  -d \'{\n    "chunks": [\n      { "content": "chunk 1 text...", "metadata": {"page": 1} },\n      { "content": "chunk 2 text...", "metadata": {"page": 2} }\n    ]\n  }\'', 'embed-req')} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white/10 rounded hover:bg-white/20">
                {copiedCode === 'embed-req' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-white" />}
              </button>
              <pre className="font-mono text-xs text-zinc-300">
                <span className="text-pink-400">curl</span> -X POST https://api.baseparse.com/v1/embed \<br/>
                {'  '}-H <span className="text-green-300">"Authorization: Bearer &lt;YOUR_API_KEY&gt;"</span> \<br/>
                {'  '}-H <span className="text-green-300">"Content-Type: application/json"</span> \<br/>
                {'  '}-d <span className="text-yellow-300">'{'{\n    "chunks": [\n      { "content": "chunk 1 text...", "metadata": {"page": 1} },\n      { "content": "chunk 2 text...", "metadata": {"page": 2} }\n    ]\n  }'}'</span>
              </pre>
            </div>
          </div>
          
          <div className="bg-zinc-900 rounded-xl overflow-hidden border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.1)]">
            <div className="flex items-center justify-between px-4 py-2 bg-purple-950/30 border-b border-purple-500/30">
              <span className="font-mono text-[10px] text-purple-300 uppercase tracking-widest">JSON Response (200 OK)</span>
            </div>
            <div className="p-4 overflow-x-auto relative group">
              <button onClick={() => copyToClipboard('{\n  "success": true,\n  "processedChunks": 2,\n  "savedToDatabase": 0,\n  "totalRequested": 2,\n  "embeddings": [\n    {\n      "content": "chunk 1 text...",\n      "metadata": { "page": 1 },\n      "vector": [0.012, -0.045, 0.089, ...]\n    }\n  ]\n}', 'embed-res')} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white/10 rounded hover:bg-white/20">
                {copiedCode === 'embed-res' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-white" />}
              </button>
              <pre className="font-mono text-[10px] sm:text-xs text-purple-300">
{`{
  "success": true,
  "processedChunks": 2,
  "savedToDatabase": 0,
  "totalRequested": 2,
  "embeddings": [
    {
      "content": "chunk 1 text...",
      "metadata": { "page": 1 },
      "vector": [0.012, -0.045, 0.089, ...]
    }
  ]
}`}
              </pre>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
