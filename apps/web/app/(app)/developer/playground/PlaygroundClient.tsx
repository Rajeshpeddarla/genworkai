'use client';

import { useState } from 'react';
import { Terminal, Send, Code2, Copy, Check, Lock } from 'lucide-react';

export default function PlaygroundClient({ initialKeys, initialSpec }: { initialKeys: any[], initialSpec: any }) {
  const [apiKey, setApiKey] = useState('');
  const [selectedPath, setSelectedPath] = useState('/v1/kb/{kbId}/search');
  const [selectedMethod, setSelectedMethod] = useState('post');
  
  const [pathParams, setPathParams] = useState<Record<string, string>>({});
  const [requestBody, setRequestBody] = useState<string>('{\n  "query": "What is GenWorkAI?",\n  "limit": 5\n}');
  
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<number | null>(null);
  const [execTime, setExecTime] = useState<number | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Derive available endpoints from OpenAPI spec
  const endpoints = initialSpec?.paths ? Object.entries(initialSpec.paths).flatMap(([path, methods]: [string, any]) => 
    Object.keys(methods).map(method => ({ path, method }))
  ) : [];

  const handleTest = async () => {
    if (!apiKey) {
      setResponse('Error: Please provide your API Key (Bearer Token)');
      setStatus(401);
      return;
    }

    setLoading(true);
    setResponse('Loading...');
    setStatus(null);
    const start = Date.now();

    try {
      // Replace path parameters
      let finalUrl = selectedPath;
      for (const [key, value] of Object.entries(pathParams)) {
        finalUrl = finalUrl.replace(`{${key}}`, value);
      }

      const res = await fetch(`/api${finalUrl}`, {
        method: selectedMethod.toUpperCase(),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: selectedMethod.toLowerCase() !== 'get' && requestBody ? requestBody : undefined
      });
      
      setStatus(res.status);
      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setResponse(`Error: ${err.message}`);
      setStatus(500);
    } finally {
      setExecTime(Date.now() - start);
      setLoading(false);
    }
  };

  const handleGenerateAIPrompt = () => {
    const prompt = `Use the following API endpoint and authentication details to build an integration function.

API Endpoint: ${selectedMethod.toUpperCase()} https://api.genworkai.in${selectedPath}
Authentication: Bearer Token (Pass the token in the Authorization header)
Request Body JSON Schema:
${requestBody}

Write a robust, production-ready async function in TypeScript that makes this fetch request, handles errors gracefully, and returns the parsed JSON.`;

    navigator.clipboard.writeText(prompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handlePathChange = (e: any) => {
    const [method, path] = e.target.value.split('|');
    setSelectedPath(path);
    setSelectedMethod(method);

    // Pre-fill dummy bodies based on selection
    if (path.includes('search')) {
      setRequestBody('{\n  "query": "What is the architecture?",\n  "limit": 5\n}');
    } else if (path.includes('ask')) {
      setRequestBody('{\n  "question": "How does the system scale?"\n}');
    } else if (path.includes('generate')) {
      setRequestBody('{\n  "prompt": "Create an executive summary",\n  "outputType": "summary"\n}');
    } else if (path.includes('db') && path.includes('ask')) {
      setRequestBody('{\n  "question": "Show me top 5 users",\n  "execute": true\n}');
    } else {
      setRequestBody('{}');
    }
  };

  return (
    <div className="p-8 lg:p-12 max-w-7xl mx-auto h-full flex flex-col">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">API Playground</h1>
          <p className="text-neutral-500 mt-1">Interactive API testing environment.</p>
        </div>
        <button 
          onClick={handleGenerateAIPrompt}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-lg transition-all"
        >
          {copiedPrompt ? <Check className="w-4 h-4" /> : <Code2 className="w-4 h-4" />}
          {copiedPrompt ? 'Copied Prompt' : 'Generate AI Prompt'}
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 flex-1 min-h-0">
        {/* Request Panel */}
        <div className="flex flex-col gap-6 overflow-y-auto pr-4">
          
          {/* API Key Selector */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm">
            <h3 className="font-bold mb-4 flex items-center gap-2"><Lock className="w-4 h-4 text-violet-500"/> Authentication</h3>
            <label className="block text-sm font-medium mb-2 text-neutral-600 dark:text-neutral-400">Bearer Token (API Key)</label>
            <input 
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              className="w-full bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-lg px-4 py-2 font-mono text-sm focus:ring-2 focus:ring-violet-500 outline-none transition-all"
              placeholder="gk_live_..."
            />
            {initialKeys?.length > 0 && (
              <p className="text-xs text-neutral-500 mt-2">
                Active Keys: {initialKeys.map(k => k.name).join(', ')} (Cannot auto-fill full tokens for security. Please paste your token.)
              </p>
            )}
          </div>

          {/* Endpoint Selector */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm">
            <h3 className="font-bold mb-4 flex items-center gap-2"><Send className="w-4 h-4 text-violet-500"/> Request Details</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-neutral-600 dark:text-neutral-400">Endpoint</label>
              <select 
                value={`${selectedMethod}|${selectedPath}`}
                onChange={handlePathChange}
                className="w-full bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-lg px-4 py-2 font-mono text-sm focus:ring-2 focus:ring-violet-500 outline-none appearance-none"
              >
                {endpoints.length > 0 ? endpoints.map((ep: any, idx) => (
                  <option key={idx} value={`${ep.method}|${ep.path}`}>
                    {ep.method.toUpperCase()} {ep.path}
                  </option>
                )) : (
                  <option value="post|/v1/kb/{kbId}/search">POST /v1/kb/&#123;kbId&#125;/search</option>
                )}
              </select>
            </div>

            {/* Dynamic Path Params */}
            {selectedPath.includes('{') && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-neutral-600 dark:text-neutral-400">Path Parameters</label>
                <div className="grid gap-3">
                  {selectedPath.match(/\\{([^}]+)\\}/g)?.map(match => {
                    const paramName = match.replace(/[{}]/g, '');
                    return (
                      <div key={paramName} className="flex items-center gap-3">
                        <span className="font-mono text-xs bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded w-24 truncate">{paramName}</span>
                        <input
                          type="text"
                          value={pathParams[paramName] || ''}
                          onChange={e => setPathParams({...pathParams, [paramName]: e.target.value})}
                          placeholder={`Enter ${paramName}`}
                          className="flex-1 bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-1.5 font-mono text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedMethod !== 'get' && (
              <div>
                <label className="block text-sm font-medium mb-2 text-neutral-600 dark:text-neutral-400">JSON Body</label>
                <textarea 
                  value={requestBody}
                  onChange={e => setRequestBody(e.target.value)}
                  className="w-full bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-lg px-4 py-3 font-mono text-sm h-48 focus:ring-2 focus:ring-violet-500 outline-none resize-y"
                />
              </div>
            )}

            <button 
              onClick={handleTest}
              disabled={loading}
              className="mt-6 w-full bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-lg font-bold shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Terminal className="w-5 h-5 animate-pulse" /> : <Send className="w-5 h-5" />}
              {loading ? 'Executing...' : 'Send Request'}
            </button>
          </div>
        </div>

        {/* Response Panel (Terminal) */}
        <div className="bg-[#0a0a0a] rounded-xl border border-neutral-800 flex flex-col overflow-hidden shadow-2xl min-h-[500px]">
          <div className="bg-neutral-900 px-4 py-3 border-b border-neutral-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-neutral-400" />
              <span className="text-sm font-medium text-neutral-300">Console Output</span>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              {execTime !== null && <span className="text-neutral-500">{execTime}ms</span>}
              {status && (
                <span className={`px-2 py-0.5 rounded font-bold ${status >= 200 && status < 300 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {status}
                </span>
              )}
            </div>
          </div>
          <div className="p-4 overflow-auto flex-1 relative group">
            {response && (
              <button 
                onClick={() => navigator.clipboard.writeText(response)}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Copy className="w-4 h-4 text-white" />
              </button>
            )}
            <pre className={`font-mono text-sm whitespace-pre-wrap ${status && status >= 400 ? 'text-red-400' : 'text-green-400'}`}>
              {response || '// Configure request details and hit Send Request...'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
