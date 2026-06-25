'use client';

import { useState, useEffect } from 'react';


export default function BYOKPage() {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [provider, setProvider] = useState('openai');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [defaultModel, setDefaultModel] = useState('');
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/developer/byok');
      const data = await res.json();
      setProviders(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setTesting(true);
    setError('');
    setSuccess('');

    try {
      // 1. Test
      const testRes = await fetch('/api/developer/byok/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey, baseUrl, defaultModel })
      });
      
      const testData = await testRes.json();
      if (!testData.success) {
        throw new Error(testData.error || 'Test failed');
      }

      // 2. Save
      const saveRes = await fetch('/api/developer/byok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey, baseUrl, defaultModel, scope: 'personal' })
      });

      const saveData = await saveRes.json();
      if (saveData.error) throw new Error(saveData.error);

      setSuccess('Provider configured successfully!');
      setApiKey('');
      fetchProviders();
    } catch (err: any) {
      setError(err.message);
    }
    setTesting(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Remove this provider?')) return;
    try {
      await fetch(`/api/developer/byok/${id}`, { method: 'DELETE' });
      fetchProviders();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">LLM Providers (BYOK)</h1>
      <p className="text-neutral-500 mb-8">Bring your own keys to route AI requests to custom models and providers.</p>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Add Provider</h2>
        {error && <div className="text-red-500 mb-4 p-3 bg-red-50 dark:bg-red-950/20 rounded">{error}</div>}
        {success && <div className="text-green-500 mb-4 p-3 bg-green-50 dark:bg-green-950/20 rounded">{success}</div>}
        
        <form onSubmit={handleTestAndSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Provider</label>
            <select 
              value={provider} 
              onChange={e => setProvider(e.target.value)}
              className="w-full border dark:border-neutral-700 bg-transparent rounded p-2"
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="gemini">Google Gemini</option>
              <option value="ollama">Ollama (Local)</option>
              <option value="openrouter">OpenRouter</option>
              <option value="custom">Custom (OpenAI Compatible)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">API Key</label>
            <input 
              suppressHydrationWarning
              type="password" 
              required={provider !== 'ollama'}
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              className="w-full border dark:border-neutral-700 bg-transparent rounded p-2"
              placeholder="sk-..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Base URL (Optional)</label>
            <input 
              suppressHydrationWarning
              type="text" 
              value={baseUrl}
              onChange={e => setBaseUrl(e.target.value)}
              className="w-full border dark:border-neutral-700 bg-transparent rounded p-2"
              placeholder="e.g. http://localhost:11434/v1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Default Model Name</label>
            <input 
              type="text" 
              value={defaultModel}
              onChange={e => setDefaultModel(e.target.value)}
              className="w-full border dark:border-neutral-700 bg-transparent rounded p-2"
              placeholder="e.g. gpt-4o, claude-3-5-sonnet-20240620"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={testing}
            className="w-full bg-black text-white dark:bg-white dark:text-black py-2 rounded-lg font-medium disabled:opacity-50"
          >
            {testing ? 'Testing & Saving...' : 'Test Connection & Save'}
          </button>
        </form>
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Configured Providers</h2>
        {loading ? (
          <p>Loading...</p>
        ) : providers.length === 0 ? (
          <p className="text-neutral-500">No providers configured. The platform defaults to deepseek.vn.</p>
        ) : (
          <div className="space-y-4">
            {providers.map(p => (
              <div key={p.id} className="flex items-center justify-between border dark:border-neutral-800 p-4 rounded-lg">
                <div>
                  <div className="font-semibold capitalize">{p.provider}</div>
                  <div className="text-sm text-neutral-500">Model: {p.defaultModel} {p.baseUrl && `| URL: ${p.baseUrl}`}</div>
                  <div className="text-xs mt-1 text-green-500">Status: {p.status}</div>
                </div>
                <button 
                  onClick={() => handleDelete(p.id)}
                  className="px-4 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/50 rounded"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
