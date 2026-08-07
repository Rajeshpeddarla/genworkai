"use client";

import { useState } from "react";
import { Copy, Check, AlertCircle, FileText, FileCode2, Link, Key, Box, Database, Lock, Layout } from "lucide-react";

export default function IntegrationGuidePage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string, language: string = 'bash') => {
    const formattedText = language ? "```" + language + "\n" + text + "\n```" : text;
    navigator.clipboard.writeText(formattedText);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
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

  const copyEntireGuideAsMarkdown = () => {
    const md = `# API Reference

Integrate BaseParse directly into your application using our REST APIs. All endpoints are authenticated via Bearer token and return standard JSON.

## Authentication
Authenticate your API requests by including your secret API key in the Authorization header.
\`\`\`bash
Authorization: Bearer <YOUR_API_KEY>
\`\`\`

## Webhooks (Async)
For production applications using the **Layout** or **Parse** APIs, you must use Webhooks. Since these models process large PDFs asynchronously, the API will return a \`job_id\` immediately and later send a POST request to your Webhook URL with the final JSON data.

\`\`\`bash
curl -X POST https://api.baseparse.com/v1/layout \\
  -H "Authorization: Bearer <YOUR_API_KEY>" \\
  -F "file=@/path/to/document.pdf" \\
  -F "webhook_url=https://your-server.com/webhook"
\`\`\`

## 1. Document Intelligence API (/v1/parse)
The flagship endpoint. Upload a PDF to instantly extract structured text, markdown tables, diagrams, and cropped images.

Request:
\`\`\`bash
curl -X POST https://api.baseparse.com/v1/parse \\
  -H "Authorization: Bearer <YOUR_API_KEY>" \\
  -F "file=@/path/to/invoice.pdf" \\
  -F "webhook_url=https://your-server.com/webhook"
\`\`\`

Response:
\`\`\`json
{
  "status": "queued",
  "job_id": 42
}
\`\`\`

## 2. Text Extraction API (/v1/ocr)
Upload a PDF and receive a continuous stream of raw text. Fast and cheap.

Request:
\`\`\`bash
curl -X POST https://api.baseparse.com/v1/ocr \\
  -H "Authorization: Bearer <YOUR_API_KEY>" \\
  -F "file=@/path/to/invoice.pdf"
\`\`\`

## 3. Semantic Chunking API (/v1/chunks)
Pass in raw text and receive it logically chunked.

Request:
\`\`\`bash
curl -X POST https://api.baseparse.com/v1/chunks \\
  -H "Authorization: Bearer <YOUR_API_KEY>" \\
  -H "Content-Type: application/json" \\
  -d '{"text": "Extracted long text..."}'
\`\`\`

## 4. Embeddings Pipeline (/v1/embed)
Send text chunks and immediately get vector embeddings back.

Request:
\`\`\`bash
curl -X POST https://api.baseparse.com/v1/embed \\
  -H "Authorization: Bearer <YOUR_API_KEY>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "chunks": [
      { "content": "chunk 1 text...", "metadata": {"page": 1} }
    ]
  }'
\`\`\`

## 5. Layout Extraction (/v1/layout)
Identical to /v1/parse, but skips parsing tables/formulas to save time. Just returns bounding boxes.

Request:
\`\`\`bash
curl -X POST https://api.baseparse.com/v1/layout \\
  -H "Authorization: Bearer <YOUR_API_KEY>" \\
  -F "file=@/path/to/invoice.pdf" \\
  -F "webhook_url=https://your-server.com/webhook"
\`\`\`
`;
    navigator.clipboard.writeText(md);
    setCopiedCode('all-markdown');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-16 animate-in fade-in duration-500 max-w-6xl mx-auto pb-24">
      {/* Header */}
      <section className="border-b border-zinc-200 dark:border-white/10 pb-8 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="font-pixel text-3xl uppercase tracking-wider mb-3">API Reference</h1>
          <p className="font-mono text-zinc-500 text-sm max-w-2xl">
            Integrate BaseParse directly into your application using our REST APIs. All endpoints are authenticated via Bearer token and return standard JSON.
          </p>
        </div>
        <button 
          onClick={copyEntireGuideAsMarkdown}
          className="shrink-0 flex items-center gap-2 px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 font-mono text-xs uppercase tracking-widest rounded-lg border border-indigo-500/20 transition-all"
        >
          {copiedCode === 'all-markdown' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copiedCode === 'all-markdown' ? 'Copied Markdown' : 'Copy All as Markdown'}
        </button>
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

      {/* Webhooks Section */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start pt-16 border-t border-zinc-200 dark:border-white/10">
        <div className="lg:col-span-1 sticky top-8">
          <div className="flex items-center gap-2 mb-2">
            <Link className="w-5 h-5 text-indigo-500" />
            <h2 className="font-pixel text-lg uppercase text-indigo-500">Webhooks (Async)</h2>
          </div>
          <p className="font-mono text-xs text-zinc-500 leading-relaxed mb-4">
            For production applications using the <strong>Layout</strong> or <strong>Parse</strong> APIs, you must use Webhooks. Since these models process large PDFs asynchronously, the API will return a <code>job_id</code> immediately and later send a POST request to your Webhook URL with the final JSON data.
          </p>
        </div>
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-900 rounded-xl overflow-hidden border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.1)]">
            <div className="flex items-center justify-between px-4 py-2 bg-indigo-950/30 border-b border-indigo-500/30">
              <span className="font-mono text-[10px] text-indigo-300 uppercase tracking-widest">How to integrate Webhooks</span>
            </div>
            <div className="p-4 overflow-x-auto relative group">
              <p className="font-mono text-xs text-zinc-300 mb-4 leading-relaxed">
                Simply include the <code className="bg-white/10 px-1 rounded text-indigo-300">webhook_url</code> field in your multipart/form-data request.
              </p>
              <pre className="font-mono text-xs text-zinc-300 bg-black/30 p-3 rounded-lg border border-white/5">
                <span className="text-pink-400">curl</span> -X POST https://api.baseparse.com/v1/layout \<br/>
                {'  '}-H <span className="text-green-300">"Authorization: Bearer &lt;YOUR_API_KEY&gt;"</span> \<br/>
                {'  '}-F <span className="text-green-300">"file=@/path/to/document.pdf"</span> \<br/>
                {'  '}-F <span className="text-green-300">"webhook_url=https://your-server.com/webhook"</span>
              </pre>
              <p className="font-mono text-xs text-zinc-300 mt-4 leading-relaxed">
                When the job completes, we will POST the final JSON payload to your server:
              </p>
              <button onClick={() => copyToClipboard(defaultJsonSchema, 'webhook-res', 'json')} className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white/10 rounded hover:bg-white/20">
                {copiedCode === 'webhook-res' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-white" />}
              </button>
              <pre className="font-mono text-[10px] sm:text-xs text-indigo-300 bg-black/30 p-3 rounded-lg border border-white/5 mt-2 custom-scrollbar max-h-96">
{defaultJsonSchema}
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
              <button onClick={() => copyToClipboard('curl -X POST https://api.baseparse.com/v1/parse \\\n  -H "Authorization: Bearer <YOUR_API_KEY>" \\\n  -F "file=@/path/to/invoice.pdf" \\\n  -F "webhook_url=https://your-server.com/webhook"', 'parse-req', 'bash')} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white/10 rounded hover:bg-white/20">
                {copiedCode === 'parse-req' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-white" />}
              </button>
              <pre className="font-mono text-xs text-zinc-300">
                <span className="text-pink-400">curl</span> -X POST https://api.baseparse.com/v1/parse \<br/>
                {'  '}-H <span className="text-green-300">"Authorization: Bearer &lt;YOUR_API_KEY&gt;"</span> \<br/>
                {'  '}-F <span className="text-green-300">"file=@/path/to/invoice.pdf"</span> \<br/>
                {'  '}-F <span className="text-green-300">"webhook_url=https://your-server.com/webhook"</span>
              </pre>
            </div>
          </div>

          <div className="bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 shadow-2xl">
            <div className="flex items-center justify-between px-4 py-2 bg-zinc-950 border-b border-zinc-800">
              <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">JSON Response (200 OK)</span>
            </div>
            <div className="p-4 overflow-x-auto relative group">
              <button onClick={() => copyToClipboard('{\n  "status": "queued",\n  "job_id": 42\n}', 'parse-res', 'json')} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white/10 rounded hover:bg-white/20">
                {copiedCode === 'parse-res' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-white" />}
              </button>
              <pre className="font-mono text-[10px] sm:text-xs text-cyan-300">
{`{
  "status": "queued",
  "job_id": 42
}`}
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
              <button onClick={() => copyToClipboard('curl -X POST https://api.baseparse.com/v1/ocr \\\n  -H "Authorization: Bearer <YOUR_API_KEY>" \\\n  -F "file=@/path/to/invoice.pdf"', 'ocr-req', 'bash')} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white/10 rounded hover:bg-white/20">
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
              <button onClick={() => copyToClipboard('{\n  "text": "Page 1... Raw extracted text flows continuously here...",\n  "usage": {\n    "pages_extracted_this_month": 150\n  }\n}', 'ocr-res', 'json')} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white/10 rounded hover:bg-white/20">
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
              <button onClick={() => copyToClipboard('curl -X POST https://api.baseparse.com/v1/chunks \\\n  -H "Authorization: Bearer <YOUR_API_KEY>" \\\n  -H "Content-Type: application/json" \\\n  -d \'{"text": "Extracted long text..."}\'', 'chunks-req', 'bash')} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white/10 rounded hover:bg-white/20">
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
              <button onClick={() => copyToClipboard('{\n  "chunks": [\n    "Introduction: This is the first logical semantic block...",\n    "Methodology: This is the second logical block..."\n  ]\n}', 'chunks-res', 'json')} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white/10 rounded hover:bg-white/20">
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
            Pass your chunked strings into this endpoint and we will automatically convert them into high-dimensional vectors and return them. You can optionally pass a <code>documentId</code> to save the vectors into our hosted database.
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
              <button onClick={() => copyToClipboard('curl -X POST https://api.baseparse.com/v1/embed \\\n  -H "Authorization: Bearer <YOUR_API_KEY>" \\\n  -H "Content-Type: application/json" \\\n  -d \'{\n    "chunks": [\n      { "content": "chunk 1 text...", "metadata": {"page": 1} },\n      { "content": "chunk 2 text...", "metadata": {"page": 2} }\n    ]\n  }\'', 'embed-req', 'bash')} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white/10 rounded hover:bg-white/20">
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
              <button onClick={() => copyToClipboard('{\n  "success": true,\n  "processedChunks": 2,\n  "savedToDatabase": 0,\n  "totalRequested": 2,\n  "embeddings": [\n    {\n      "content": "chunk 1 text...",\n      "metadata": { "page": 1 },\n      "vector": [0.012, -0.045, 0.089, ...]\n    }\n  ]\n}', 'embed-res', 'json')} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white/10 rounded hover:bg-white/20">
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

      {/* 5. Layout API */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start pt-16 border-t border-zinc-200 dark:border-white/10">
        <div className="lg:col-span-1 sticky top-8">
          <div className="flex items-center gap-2 mb-2">
            <Layout className="w-5 h-5 text-emerald-500" />
            <h2 className="font-pixel text-lg uppercase text-emerald-500">Layout Extraction</h2>
            <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded text-[10px] font-bold">PRO</span>
          </div>
          <p className="font-mono text-xs text-zinc-500 leading-relaxed mb-4">
            A premium, high-accuracy endpoint utilizing advanced vision models to deeply understand complex document layouts, preserving tables, figures, checkboxes, and reading order perfectly.
          </p>
          <div className="font-mono text-xs bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 p-3 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-zinc-500">Method</span>
              <span className="text-green-600 dark:text-green-400 font-bold">POST</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-zinc-500">Endpoint</span>
              <span className="text-black dark:text-white">/v1/layout</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">Content-Type</span>
              <span className="text-black dark:text-white">multipart/form-data</span>
            </div>
          </div>
        </div>
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-900 rounded-xl overflow-hidden border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
            <div className="flex items-center justify-between px-4 py-2 bg-emerald-950/30 border-b border-emerald-500/30">
              <span className="font-mono text-[10px] text-emerald-300 uppercase tracking-widest">cURL Request</span>
            </div>
            <div className="p-4 overflow-x-auto relative group">
              <button onClick={() => copyToClipboard('curl -X POST https://api.baseparse.com/v1/layout \\\n  -H "Authorization: Bearer <YOUR_API_KEY>" \\\n  -F "file=@/path/to/invoice.pdf" \\\n  -F "webhook_url=https://your-server.com/webhook"', 'layout-req', 'bash')} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white/10 rounded hover:bg-white/20">
                {copiedCode === 'layout-req' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-white" />}
              </button>
              <pre className="font-mono text-xs text-zinc-300">
                <span className="text-pink-400">curl</span> -X POST https://api.baseparse.com/v1/layout \<br/>
                {'  '}-H <span className="text-green-300">"Authorization: Bearer &lt;YOUR_API_KEY&gt;"</span> \<br/>
                {'  '}-F <span className="text-green-300">"file=@/path/to/invoice.pdf"</span> \<br/>
                {'  '}-F <span className="text-green-300">"webhook_url=https://your-server.com/webhook"</span>
              </pre>
            </div>
          </div>
          
          <div className="bg-zinc-900 rounded-xl overflow-hidden border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
            <div className="flex items-center justify-between px-4 py-2 bg-emerald-950/30 border-b border-emerald-500/30">
              <span className="font-mono text-[10px] text-emerald-300 uppercase tracking-widest">JSON Response (200 OK)</span>
            </div>
            <div className="p-4 overflow-x-auto relative group">
              <button onClick={() => copyToClipboard('{\n  "status": "queued",\n  "job_id": 42\n}', 'layout-res', 'json')} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white/10 rounded hover:bg-white/20">
                {copiedCode === 'layout-res' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-white" />}
              </button>
              <pre className="font-mono text-[10px] sm:text-xs text-emerald-300">
{`{
  "status": "queued",
  "job_id": 42
}`}
              </pre>
            </div>
          </div>
        </div>
      </section>



    </div>
  );
}
