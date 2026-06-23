'use client';

import { useState } from 'react';
import { Copy, Check, Terminal, Code2, Lock, ShieldAlert, Activity } from 'lucide-react';

export default function DocsViewer({ initialSpec }: { initialSpec: any }) {
  const [copiedAI, setCopiedAI] = useState(false);
  const [activeTab, setActiveTab] = useState<{ [key: string]: string }>({});
  
  const handleCopyAI = () => {
    // Generate the massive markdown string
    let md = `# GenWorkAI API Integration Context\n\n`;
    md += `## Authentication\nAll API endpoints require a Bearer token in the Authorization header.\nExample: \`Authorization: Bearer gk_live_12345\`\n\n`;
    
    if (initialSpec?.paths) {
      md += `## Endpoints\n\n`;
      Object.entries(initialSpec.paths).forEach(([path, methods]: [string, any]) => {
        Object.entries(methods).forEach(([method, details]: [string, any]) => {
          md += `### ${method.toUpperCase()} ${path}\n`;
          md += `**Summary**: ${details.summary}\n`;
          md += `**Description**: ${details.description}\n\n`;
          
          if (details.parameters) {
            md += `#### Path Parameters\n`;
            details.parameters.forEach((p: any) => {
              md += `- \`${p.name}\` (${p.schema.type}): Required\n`;
            });
            md += `\n`;
          }
          
          if (details.requestBody) {
            md += `#### Request Body (application/json)\n`;
            const schema = details.requestBody.content['application/json'].schema;
            md += `\`\`\`json\n${JSON.stringify(schema, null, 2)}\n\`\`\`\n\n`;
          }
          
          if (details.responses) {
            md += `#### Responses\n`;
            Object.entries(details.responses).forEach(([code, res]: [string, any]) => {
              md += `- **${code}**: ${res.description || ''}\n`;
              if (res.content?.['application/json']?.schema) {
                md += `\`\`\`json\n${JSON.stringify(res.content['application/json'].schema, null, 2)}\n\`\`\`\n`;
              }
            });
            md += `\n`;
          }
        });
      });
    }

    navigator.clipboard.writeText(md);
    setCopiedAI(true);
    setTimeout(() => setCopiedAI(false), 2000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const generateSnippet = (method: string, path: string, lang: string, requestBody?: any) => {
    const fullUrl = `https://api.genworkai.in${path}`;
    const payload = requestBody ? JSON.stringify({ example: "data" }, null, 2) : '';

    switch(lang) {
      case 'curl':
        return `curl -X ${method.toUpperCase()} ${fullUrl} \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"${payload ? ` \\\n  -d '${payload}'` : ''}`;
      
      case 'javascript':
        return `const response = await fetch('${fullUrl}', {
  method: '${method.toUpperCase()}',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }${payload ? `,\n  body: JSON.stringify(${payload})` : ''}
});
const data = await response.json();`;

      case 'python':
        return `import requests

url = "${fullUrl}"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}
${payload ? `payload = ${payload}\nresponse = requests.${method.toLowerCase()}(url, json=payload, headers=headers)` : `response = requests.${method.toLowerCase()}(url, headers=headers)`}

print(response.json())`;
      
      case 'typescript':
        return `const response = await fetch('${fullUrl}', {
  method: '${method.toUpperCase()}',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }${payload ? `,\n  body: JSON.stringify(${payload})` : ''}
});
const data = await response.json();`;
      default: return '';
    }
  };

  return (
    <div className="flex w-full">
      {/* Docs Sidebar */}
      <div className="w-64 border-r border-neutral-200 dark:border-neutral-800 p-6 hidden lg:block overflow-y-auto">
        <nav className="flex flex-col gap-6">
          <div>
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">Getting Started</h3>
            <ul className="flex flex-col gap-2">
              <li><a href="#authentication" className="text-sm text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white flex items-center gap-2"><Lock className="w-4 h-4" /> Authentication</a></li>
              <li><a href="#errors" className="text-sm text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> Errors</a></li>
              <li><a href="#ratelimits" className="text-sm text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white flex items-center gap-2"><Activity className="w-4 h-4" /> Rate Limits</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">API Reference</h3>
            <ul className="flex flex-col gap-2">
              {initialSpec?.paths && Object.entries(initialSpec.paths).map(([path, _]) => (
                <li key={path}>
                  <a href={`#${path.replace(/[^a-zA-Z0-9]/g, '')}`} className="text-sm text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white font-mono truncate block">
                    {path}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto relative p-8 lg:p-12 xl:p-16">
        <div className="absolute top-8 right-8 z-10">
          <button 
            onClick={handleCopyAI}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg font-medium shadow-lg transition-all"
          >
            {copiedAI ? <Check className="w-4 h-4" /> : <Code2 className="w-4 h-4" />}
            {copiedAI ? 'Copied Context' : 'Copy For AI'}
          </button>
        </div>

        <div className="mb-16">
          <h1 className="text-4xl font-bold mb-4">API Documentation</h1>
          <p className="text-xl text-neutral-500">Integrate GenWorkAI directly into your applications.</p>
        </div>

        <div id="authentication" className="mb-16">
          <h2 className="text-2xl font-bold mb-4 border-b border-neutral-200 dark:border-neutral-800 pb-2">Authentication</h2>
          <p className="mb-4 text-neutral-600 dark:text-neutral-300">
            Authenticate your API requests using a Bearer token in the <code className="bg-neutral-100 dark:bg-neutral-800 px-1 rounded">Authorization</code> header.
            You can generate an API key from the API Keys dashboard.
          </p>
          <div className="bg-neutral-900 rounded-lg p-4 font-mono text-sm text-green-400 border border-neutral-800">
            Authorization: Bearer gk_live_xxxxxxxxxxxxxxxxxxxx
          </div>
        </div>

        <div id="errors" className="mb-16">
          <h2 className="text-2xl font-bold mb-4 border-b border-neutral-200 dark:border-neutral-800 pb-2">Errors</h2>
          <p className="mb-4 text-neutral-600 dark:text-neutral-300">
            GenWorkAI uses conventional HTTP response codes to indicate the success or failure of an API request.
          </p>
          <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden mb-6">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
                <tr>
                  <th className="px-4 py-3 font-medium text-neutral-500">Code</th>
                  <th className="px-4 py-3 font-medium text-neutral-500">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                <tr>
                  <td className="px-4 py-3 font-mono text-green-500 font-bold">200 - OK</td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">Everything worked as expected.</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono text-red-500 font-bold">400 - Bad Request</td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">The request was unacceptable, often due to missing a required parameter.</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono text-red-500 font-bold">401 - Unauthorized</td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">No valid API key provided.</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono text-red-500 font-bold">403 - Forbidden</td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">The API key doesn't have permissions to perform the request.</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono text-red-500 font-bold">404 - Not Found</td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">The requested resource doesn't exist.</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono text-red-500 font-bold">429 - Too Many Requests</td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">Too many requests hit the API too quickly. We recommend an exponential backoff of your requests.</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono text-red-500 font-bold">500 - Server Error</td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">Something went wrong on GenWorkAI's end.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div id="ratelimits" className="mb-16">
          <h2 className="text-2xl font-bold mb-4 border-b border-neutral-200 dark:border-neutral-800 pb-2">Rate Limits</h2>
          <p className="mb-4 text-neutral-600 dark:text-neutral-300">
            Rate limits are applied at the organizational level based on your active billing tier.
          </p>
          <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-6">
            <h3 className="font-bold mb-2">Free Tier</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">No API access. Upgrade to Pro to use the API.</p>
            <h3 className="font-bold mb-2">Pro Tier</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">600 requests per minute</p>
            <h3 className="font-bold mb-2">Enterprise</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Custom limits up to 10,000+ requests per minute</p>
          </div>
        </div>

        {initialSpec?.paths && Object.entries(initialSpec.paths).map(([path, methods]: [string, any]) => (
          <div key={path} className="mb-16">
            {Object.entries(methods).map(([method, details]: [string, any]) => {
              const endpointId = path.replace(/[^a-zA-Z0-9]/g, '');
              const activeLang = activeTab[endpointId] || 'curl';
              const snippet = generateSnippet(method, path, activeLang, details.requestBody);

              return (
                <div key={method} id={endpointId} className="flex flex-wrap gap-8 border-t border-neutral-200 dark:border-neutral-800 pt-12">
                  {/* Left Column: Docs */}
                  <div className="flex-1 min-w-[300px] xl:min-w-[400px]">
                    <div className="flex items-center gap-3 mb-4">
                      <span className={`px-2 py-1 text-xs font-bold rounded uppercase ${method === 'get' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                        {method}
                      </span>
                      <code className="text-lg font-mono font-bold">{path}</code>
                    </div>
                    
                    <h3 className="text-xl font-semibold mb-2">{details.summary}</h3>
                    <p className="text-neutral-600 dark:text-neutral-400 mb-6">{details.description}</p>

                    {details.parameters && (
                      <div className="mb-6">
                        <h4 className="font-bold mb-3 uppercase text-xs tracking-wider text-neutral-500">Path Parameters</h4>
                        <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden">
                          <table className="w-full text-left text-sm">
                            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                              {details.parameters.map((p: any) => (
                                <tr key={p.name}>
                                  <td className="px-4 py-3 font-mono font-bold">{p.name}</td>
                                  <td className="px-4 py-3 text-neutral-500">{p.schema.type}</td>
                                  <td className="px-4 py-3 text-red-500 text-xs font-bold uppercase">{p.required ? 'Required' : 'Optional'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {details.requestBody && (
                      <div className="mb-6">
                        <h4 className="font-bold mb-3 uppercase text-xs tracking-wider text-neutral-500">Request Body</h4>
                        <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-4 border border-neutral-200 dark:border-neutral-800 overflow-x-auto">
                          <pre className="text-sm font-mono text-neutral-800 dark:text-neutral-300">
                            {JSON.stringify(details.requestBody.content['application/json'].schema, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Code Snippets */}
                  <div className="flex-1 min-w-[300px] xl:min-w-[450px] max-w-full 2xl:max-w-[550px]">
                    <div className="bg-[#0a0a0a] rounded-xl overflow-hidden border border-neutral-800 shadow-2xl">
                      <div className="flex border-b border-neutral-800 bg-neutral-900">
                        {['curl', 'javascript', 'typescript', 'python'].map(lang => (
                          <button
                            key={lang}
                            onClick={() => setActiveTab({...activeTab, [endpointId]: lang})}
                            className={`px-4 py-2 text-xs font-mono ${activeLang === lang ? 'text-white border-b-2 border-violet-500 bg-black/50' : 'text-neutral-500 hover:text-neutral-300'}`}
                          >
                            {lang}
                          </button>
                        ))}
                      </div>
                      <div className="p-4 relative group">
                        <button 
                          onClick={() => copyToClipboard(snippet)}
                          className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Copy className="w-4 h-4 text-white" />
                        </button>
                        <pre className="text-sm font-mono text-green-400 overflow-x-auto">
                          {snippet}
                        </pre>
                      </div>
                    </div>

                    {details.responses && (
                      <div className="mt-4 bg-[#0a0a0a] rounded-xl overflow-hidden border border-neutral-800 shadow-2xl">
                         <div className="px-4 py-2 border-b border-neutral-800 bg-neutral-900 text-xs font-mono text-neutral-400">
                          Example Response
                        </div>
                        <div className="p-4 overflow-x-auto">
                          <pre className="text-sm font-mono text-blue-400">
                            {JSON.stringify(details.responses['200']?.content?.['application/json']?.schema || { status: "success" }, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
