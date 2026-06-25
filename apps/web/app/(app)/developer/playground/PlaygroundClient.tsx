'use client';

import { useState, useEffect } from 'react';
import { Terminal, Send, Code2, Copy, Check, Lock, ChevronRight, Play, Save, History, Database, Server, Bot, FileText } from 'lucide-react';

export default function PlaygroundClient({ initialKeys, initialSpec, resources }: { initialKeys: any[], initialSpec: any, resources: any }) {
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
  const [activeTab, setActiveTab] = useState<'params' | 'body' | 'headers' | 'auth'>('body');
  const [responseTab, setResponseTab] = useState<'response' | 'code' | 'docs'>('response');
  const [codeLanguage, setCodeLanguage] = useState<'curl' | 'js' | 'python'>('curl');

  // Derive available endpoints from OpenAPI spec
  const endpoints = initialSpec?.paths ? Object.entries(initialSpec.paths).flatMap(([path, methods]: [string, any]) => 
    Object.keys(methods).map(method => ({ path, method, details: methods[method] }))
  ) : [];

  // Local Storage History
  const [history, setHistory] = useState<any[]>([]);
  useEffect(() => {
    const saved = localStorage.getItem('gk_playground_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const saveToHistory = (req: any) => {
    const newHistory = [req, ...history].slice(0, 50);
    setHistory(newHistory);
    localStorage.setItem('gk_playground_history', JSON.stringify(newHistory));
  };

  const handleTest = async () => {
    if (!apiKey) {
      setResponse('Error: Please provide your API Key (Bearer Token)');
      setStatus(401);
      setResponseTab('response');
      return;
    }

    setLoading(true);
    setResponse('Loading...');
    setStatus(null);
    setResponseTab('response');
    const start = Date.now();

    try {
      let finalUrl = selectedPath;
      for (const [key, value] of Object.entries(pathParams)) {
        finalUrl = finalUrl.replace(`{${key}}`, value || '');
      }

      const reqOpts = {
        method: selectedMethod.toUpperCase(),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: selectedMethod.toLowerCase() !== 'get' && requestBody ? requestBody : undefined
      };

      const res = await fetch(`/api${finalUrl}`, reqOpts);
      setStatus(res.status);
      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));

      saveToHistory({ url: finalUrl, method: selectedMethod, status: res.status, time: Date.now() });

    } catch (err: any) {
      setResponse(`Error: ${err.message}`);
      setStatus(500);
    } finally {
      setExecTime(Date.now() - start);
      setLoading(false);
    }
  };

  const handleEndpointSelect = (method: string, path: string) => {
    setSelectedPath(path);
    setSelectedMethod(method);
    
    // Auto-fill dummy bodies
    if (path.includes('search')) {
      setRequestBody('{\n  "query": "What is the architecture?",\n  "limit": 5\n}');
    } else if (path.includes('generate')) {
      setRequestBody('{\n  "prompt": "Create an executive summary"\n}');
    } else {
      setRequestBody('{}');
    }
  };

  const generateCode = () => {
    let finalUrl = selectedPath;
    for (const [key, value] of Object.entries(pathParams)) {
      finalUrl = finalUrl.replace(`{${key}}`, value || `{${key}}`);
    }
    const fullUrl = `https://api.genworkai.in${finalUrl}`;

    if (codeLanguage === 'curl') {
      return `curl -X ${selectedMethod.toUpperCase()} "${fullUrl}" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
${selectedMethod !== 'get' ? `  -d '${requestBody}'` : ''}`;
    }

    if (codeLanguage === 'js') {
      return `const response = await fetch("${fullUrl}", {
  method: "${selectedMethod.toUpperCase()}",
  headers: {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
  }${selectedMethod !== 'get' ? `,\n  body: JSON.stringify(${requestBody})` : ''}
});
const data = await response.json();
console.log(data);`;
    }

    if (codeLanguage === 'python') {
      return `import requests

url = "${fullUrl}"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}
${selectedMethod !== 'get' ? `data = ${requestBody}\n` : ''}
response = requests.${selectedMethod.toLowerCase()}(url, headers=headers${selectedMethod !== 'get' ? ', json=data' : ''})
print(response.json())`;
    }

    return '';
  };

  return (
    <div className="flex h-full bg-neutral-50 dark:bg-black text-sm">
      
      {/* LEFT: Endpoint Explorer */}
      <div className="w-64 border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0a0a0a] flex flex-col hidden md:flex">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 font-bold">Endpoints</div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {endpoints.map((ep, idx) => {
            const isSelected = selectedPath === ep.path && selectedMethod === ep.method;
            return (
              <button
                key={idx}
                onClick={() => handleEndpointSelect(ep.method, ep.path)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono flex items-center gap-2 truncate transition-colors ${
                  isSelected ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400' : 'hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                <span className={`w-8 font-bold ${
                  ep.method === 'get' ? 'text-green-500' : 
                  ep.method === 'post' ? 'text-blue-500' : 
                  ep.method === 'delete' ? 'text-red-500' : 'text-yellow-500'
                }`}>{ep.method.toUpperCase()}</span>
                <span className="truncate">{ep.path}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* CENTER: Request Builder */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0a0a0a]">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-4">
          <div className="flex-1 flex items-center bg-neutral-100 dark:bg-neutral-900 rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800">
            <div className={`px-4 py-2 font-bold font-mono text-xs border-r border-neutral-200 dark:border-neutral-800 ${
              selectedMethod === 'get' ? 'text-green-500' : selectedMethod === 'post' ? 'text-blue-500' : 'text-yellow-500'
            }`}>
              {selectedMethod.toUpperCase()}
            </div>
            <input 
              readOnly 
              value={`https://api.genworkai.in${selectedPath}`}
              className="flex-1 bg-transparent px-4 py-2 outline-none font-mono text-xs text-neutral-600 dark:text-neutral-300"
            />
          </div>
          <button onClick={handleTest} disabled={loading} className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50 transition-all">
            {loading ? <Terminal className="w-4 h-4 animate-pulse" /> : <Play className="w-4 h-4" />} Send
          </button>
        </div>

        {/* Builder Tabs */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800 px-4 pt-2 gap-6 bg-neutral-50 dark:bg-neutral-900">
          {['params', 'auth', 'headers', 'body'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`pb-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
                activeTab === tab ? 'border-violet-500 text-violet-600 dark:text-violet-400' : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'auth' && (
            <div className="max-w-xl">
              <h3 className="font-bold mb-4 flex items-center gap-2"><Lock className="w-4 h-4 text-violet-500"/> Bearer Token Authorization</h3>
              <p className="text-xs text-neutral-500 mb-4">The backend stores hashes of your API keys. Please paste the full secret token you received during creation.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">Select Key (Optional)</label>
                  <select className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-violet-500">
                    <option value="">Manual Entry...</option>
                    {initialKeys?.map(k => <option key={k.id} value={k.keyPrefix}>{k.name} ({k.keyPrefix}...)</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">Token Secret</label>
                  <input 
                    type="password"
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded px-3 py-2 font-mono text-xs outline-none focus:ring-1 focus:ring-violet-500"
                    placeholder="gk_live_..."
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'params' && (
            <div className="max-w-xl">
              <h3 className="font-bold mb-4">Path Parameters</h3>
              {selectedPath.includes('{') ? (
                <div className="grid gap-3 border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden">
                  {selectedPath.match(/\\{([^}]+)\\}/g)?.map((match, i) => {
                    const paramName = match.replace(/[{}]/g, '');
                    const resourceList = resources[paramName] || []; // kbId -> resources.kbId
                    
                    return (
                      <div key={paramName} className={`flex items-center gap-4 p-3 ${i > 0 ? 'border-t border-neutral-200 dark:border-neutral-800' : ''}`}>
                        <span className="font-mono text-xs font-bold text-neutral-700 dark:text-neutral-300 w-24 truncate">{paramName}</span>
                        
                        {/* Dynamic Dropdown if we have resources for this ID type */}
                        {resourceList.length > 0 ? (
                          <select
                            value={pathParams[paramName] || ''}
                            onChange={e => setPathParams({...pathParams, [paramName]: e.target.value})}
                            className="flex-1 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded px-3 py-1.5 font-mono text-xs outline-none focus:ring-1 focus:ring-violet-500"
                          >
                            <option value="">-- Select Resource --</option>
                            {resourceList.map((res: any) => (
                              <option key={res.id} value={res.id}>{res.name} (ID: {res.id})</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={pathParams[paramName] || ''}
                            onChange={e => setPathParams({...pathParams, [paramName]: e.target.value})}
                            placeholder={`Enter ${paramName}`}
                            className="flex-1 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded px-3 py-1.5 font-mono text-xs outline-none focus:ring-1 focus:ring-violet-500"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-neutral-500 italic">This endpoint does not require path parameters.</p>
              )}
            </div>
          )}

          {activeTab === 'body' && (
            <div className="h-full flex flex-col">
              {selectedMethod === 'get' ? (
                <p className="text-xs text-neutral-500 italic">GET requests do not support a JSON body.</p>
              ) : (
                <textarea 
                  value={requestBody}
                  onChange={e => setRequestBody(e.target.value)}
                  className="flex-1 w-full bg-neutral-50 dark:bg-[#111] border border-neutral-200 dark:border-neutral-800 rounded-lg p-4 font-mono text-xs outline-none focus:border-violet-500 resize-none"
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Response & Code Samples */}
      <div className="w-1/3 min-w-[400px] flex flex-col bg-white dark:bg-black">
        {/* Right Tabs */}
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 px-4 pt-2 bg-neutral-50 dark:bg-[#111]">
          <div className="flex gap-4">
            <button onClick={() => setResponseTab('response')} className={`pb-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${responseTab === 'response' ? 'border-violet-500 text-violet-600 dark:text-violet-400' : 'border-transparent text-neutral-500'}`}>Response</button>
            <button onClick={() => setResponseTab('code')} className={`pb-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${responseTab === 'code' ? 'border-violet-500 text-violet-600 dark:text-violet-400' : 'border-transparent text-neutral-500'}`}>Code</button>
            <button onClick={() => setResponseTab('docs')} className={`pb-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${responseTab === 'docs' ? 'border-violet-500 text-violet-600 dark:text-violet-400' : 'border-transparent text-neutral-500'}`}>Docs</button>
          </div>
          
          {responseTab === 'response' && status && (
            <div className="flex items-center gap-3 text-xs font-mono pb-2">
              <span className={`font-bold ${status >= 200 && status < 300 ? 'text-green-500' : 'text-red-500'}`}>{status} OK</span>
              <span className="text-neutral-500">{execTime}ms</span>
            </div>
          )}
        </div>

        {/* Right Content */}
        <div className="flex-1 p-4 overflow-y-auto font-mono text-xs relative group">
          {responseTab === 'response' && (
            <>
              {response && (
                <button onClick={() => navigator.clipboard.writeText(response)} className="absolute top-4 right-4 p-1.5 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <Copy className="w-3.5 h-3.5" />
                </button>
              )}
              <pre className={`whitespace-pre-wrap ${status && status >= 400 ? 'text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                {response || '// Hit send to execute request...'}
              </pre>
            </>
          )}

          {responseTab === 'code' && (
            <div className="flex flex-col h-full">
              <div className="flex gap-2 mb-4">
                {['curl', 'js', 'python'].map(lang => (
                  <button 
                    key={lang} 
                    onClick={() => setCodeLanguage(lang as any)}
                    className={`px-3 py-1 rounded text-xs font-bold uppercase ${codeLanguage === lang ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
              <div className="relative flex-1 bg-neutral-50 dark:bg-[#111] border border-neutral-200 dark:border-neutral-800 rounded-lg p-4 overflow-hidden">
                <button onClick={() => navigator.clipboard.writeText(generateCode())} className="absolute top-2 right-2 p-1.5 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 rounded">
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <pre className="whitespace-pre-wrap text-blue-600 dark:text-blue-400 overflow-y-auto h-full">
                  {generateCode()}
                </pre>
              </div>
            </div>
          )}

          {responseTab === 'docs' && (
            <div className="font-sans text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              <h3 className="font-bold text-neutral-900 dark:text-white mb-2 text-lg">Endpoint Documentation</h3>
              <p className="mb-4">Select an endpoint from the left sidebar to view auto-generated documentation based on our OpenAPI specification.</p>
              
              <div className="bg-neutral-100 dark:bg-neutral-900 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
                <h4 className="font-bold text-xs uppercase tracking-wider mb-2 text-neutral-500">Authentication</h4>
                <p className="mb-4">All API requests must be authenticated via a Bearer token in the Authorization header.</p>
                
                <h4 className="font-bold text-xs uppercase tracking-wider mb-2 text-neutral-500">Rate Limits</h4>
                <p>Limits are applied per minute and per month based on your active billing tier.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
