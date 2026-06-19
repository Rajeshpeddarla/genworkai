"use client";

import { useState } from 'react';

export default function DeveloperPlaygroundPage() {
  const [apiKey, setApiKey] = useState('');
  const [kbId, setKbId] = useState('');
  const [endpoint, setEndpoint] = useState('/v1/kb/{kbId}/search');
  const [payload, setPayload] = useState('{\n  "query": "What is the main architecture?",\n  "limit": 5\n}');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    if (!apiKey || !kbId) {
      setResponse('Error: Please provide API Key and KB ID');
      return;
    }

    setLoading(true);
    setResponse('Loading...');
    try {
      const url = `/api` + endpoint.replace('{kbId}', kbId);
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: payload
      });
      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setResponse(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">API Playground</h1>
        <p className="text-neutral-500 mt-1">Test your endpoints securely before writing code.</p>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Request Panel */}
        <div className="flex flex-col gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Bearer Token (API Key)</label>
            <input 
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-4 py-2"
              placeholder="gk_live_..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Knowledge Base ID</label>
              <input 
                type="number"
                value={kbId}
                onChange={e => setKbId(e.target.value)}
                className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-4 py-2"
                placeholder="e.g. 12"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Endpoint</label>
              <select 
                value={endpoint}
                onChange={e => {
                  setEndpoint(e.target.value);
                  if (e.target.value.includes('kb') && e.target.value.includes('search')) {
                    setPayload('{\n  "query": "What is the architecture?",\n  "limit": 5\n}');
                  } else if (e.target.value.includes('kb') && e.target.value.includes('ask')) {
                    setPayload('{\n  "question": "How does the system scale?"\n}');
                  } else if (e.target.value.includes('kb') && e.target.value.includes('generate')) {
                    setPayload('{\n  "prompt": "Create an executive summary",\n  "outputType": "summary"\n}');
                  } else if (e.target.value.includes('db') && e.target.value.includes('schema')) {
                    setPayload('{}'); // GET doesn't need payload, but keep JSON valid
                  } else if (e.target.value.includes('db') && e.target.value.includes('ask')) {
                    setPayload('{\n  "question": "Show me the top 5 users by recent activity",\n  "execute": true\n}');
                  } else if (e.target.value.includes('db') && e.target.value.includes('documentation')) {
                    setPayload('{}');
                  }
                }}
                className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-4 py-2"
              >
                <optgroup label="Knowledge API">
                  <option value="/v1/kb/{kbId}/search">POST /v1/kb/&#123;kbId&#125;/search</option>
                  <option value="/v1/kb/{kbId}/ask">POST /v1/kb/&#123;kbId&#125;/ask</option>
                  <option value="/v1/kb/{kbId}/generate">POST /v1/kb/&#123;kbId&#125;/generate</option>
                </optgroup>
                <optgroup label="Database API">
                  <option value="/v1/db/{kbId}/schema">GET /v1/db/&#123;dbId&#125;/schema</option>
                  <option value="/v1/db/{kbId}/ask">POST /v1/db/&#123;dbId&#125;/ask</option>
                  <option value="/v1/db/{kbId}/documentation">GET /v1/db/&#123;dbId&#125;/documentation</option>
                </optgroup>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">JSON Payload</label>
            <textarea 
              value={payload}
              onChange={e => setPayload(e.target.value)}
              className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-4 py-3 font-mono text-sm h-48"
            />
          </div>

          <button 
            onClick={handleTest}
            disabled={loading}
            className="bg-black text-white dark:bg-white dark:text-black py-3 rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Sending Request...' : 'Send Request'}
          </button>
        </div>

        {/* Response Panel */}
        <div className="bg-neutral-950 rounded-xl border border-neutral-800 flex flex-col overflow-hidden">
          <div className="bg-neutral-900 px-4 py-3 border-b border-neutral-800 flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-300">Response JSON</span>
            <span className="text-xs text-neutral-500">200 OK</span>
          </div>
          <div className="p-4 overflow-auto flex-1">
            <pre className="text-green-400 font-mono text-sm whitespace-pre-wrap">
              {response || '// Hit Send Request to see the output'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
