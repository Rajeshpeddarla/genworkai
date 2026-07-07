'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function ApiDetailPage() {
  const params = useParams();
  const slug = params.id as string;

  const [api, setApi] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [testPayload, setTestPayload] = useState('{\n  "query": "hello world"\n}');
  const [testResponse, setTestResponse] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [isStream, setIsStream] = useState(false);
  const [baseUrl, setBaseUrl] = useState('');

  useEffect(() => {
    setBaseUrl(typeof window !== 'undefined' ? window.location.origin : '');
    const fetchApi = async () => {
      try {
        const res = await fetch(`/api/developer/apis/${slug}`);
        const json = await res.json();
        if (json.success) {
          setApi(json.api);
        }
      } catch (err) {
        console.error('Failed to load API', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchApi();
  }, [slug]);

  const handleTest = async () => {
    setIsTesting(true);
    setTestResponse('');
    try {
      let parsedPayload = {};
      if (api.method !== 'GET') {
        try {
          parsedPayload = JSON.parse(testPayload);
        } catch (e) {
          setTestResponse('Error: Invalid JSON payload');
          setIsTesting(false);
          return;
        }
      }

      const endpoint = `/api/v1/${api.userId}/${slug}${isStream ? '?stream=true' : ''}`;
      
      const res = await fetch(endpoint, {
        method: api.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: (api.method !== 'GET') ? JSON.stringify(parsedPayload) : undefined,
      });

      if (isStream) {
        if (!res.ok) {
          const text = await res.text();
          setTestResponse(`Error: ${res.status} ${res.statusText}\n${text}`);
          return;
        }
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let content = '';
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            content += chunk;
            setTestResponse(content);
          }
        }
      } else {
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          setTestResponse(JSON.stringify(data, null, 2));
        } catch (e) {
          setTestResponse(`Response (${res.status} ${res.statusText}):\n${text}`);
        }
      }
    } catch (err: any) {
      setTestResponse(`Error: ${err.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-neutral-500">Loading API...</div>;
  }

  if (!api) {
    return <div className="p-8 text-center text-red-500">API not found</div>;
  }

  const endpointUrl = `${baseUrl}/api/v1/${api.userId}/${api.slug}`;
  const curlUrl = isStream ? `${endpointUrl}?stream=true` : endpointUrl;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <Link href="/developer/apis" className="text-sm font-medium text-neutral-500 hover:text-black dark:hover:text-white mb-6 inline-block">
        ← Back to APIs
      </Link>
      
      <div className="flex items-center justify-between mb-8">
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{api.name}</h1>
          <div className="mt-4 bg-neutral-900 text-neutral-300 p-4 rounded-xl font-mono text-sm overflow-x-auto whitespace-pre">
            {api.method === 'GET' 
              ? `curl -X GET "${curlUrl}"`
              : `curl -X POST "${curlUrl}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"query": "your input here"}'`}
          </div>
        </div>
        <div className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-bold px-3 py-1.5 rounded-lg uppercase">
          {api.method || 'POST'}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Workflow Configuration</h3>
              <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isStream} 
                  onChange={(e) => setIsStream(e.target.checked)}
                  className="rounded border-neutral-300 text-black focus:ring-black"
                />
                Stream Response
              </label>
            </div>
            <div className="space-y-3">
              {api.workflow?.map((step: string, index: number) => {
                const colors = [
                  "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
                  "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
                  "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
                ];
                const colorClass = colors[index % colors.length];
                return (
                  <div key={index} className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${colorClass}`}>
                      {index + 1}
                    </div>
                    <div>{step}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-4">Test API</h3>
            
            {api.method !== 'GET' ? (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Request Payload (JSON)</label>
                <textarea 
                  value={testPayload}
                  onChange={(e) => setTestPayload(e.target.value)}
                  className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 font-mono text-sm h-32 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  spellCheck={false}
                />
              </div>
            ) : (
              <div className="mb-4 text-sm text-neutral-500">
                GET requests do not require a JSON payload. The AI will generate a response based purely on the workflow instructions.
              </div>
            )}
            
            <button 
              onClick={handleTest}
              disabled={isTesting}
              className="w-full bg-violet-600 text-white py-3 rounded-xl font-medium hover:bg-violet-700 transition-colors disabled:opacity-50"
            >
              {isTesting ? "Executing..." : "Send Request"}
            </button>
            
            {testResponse && (
              <div className="mt-6">
                <label className="block text-sm font-medium mb-2">Response</label>
                <pre className="w-full bg-neutral-950 text-emerald-400 border border-neutral-800 rounded-xl p-4 font-mono text-xs overflow-auto max-h-64 whitespace-pre-wrap">
                  {testResponse}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
