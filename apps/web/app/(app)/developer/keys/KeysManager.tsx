'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function KeysManager({ initialKeys }: { initialKeys: any[] }) {
  const [keys, setKeys] = useState(initialKeys);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newKeyData, setNewKeyData] = useState<{ rawKey: string, key: any } | null>(null);
  const router = useRouter();

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      setNewKeyData(null);
      
      const res = await fetch('/api/developer/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Production API Key' })
      });
      
      if (!res.ok) throw new Error('Failed to generate key');
      
      const data = await res.json();
      setKeys([data.key, ...keys]);
      setNewKeyData(data);
      router.refresh();
    } catch (err) {
      alert(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRevoke = async (id: number) => {
    if (!confirm('Are you sure you want to revoke this API key? Any applications using it will immediately lose access.')) return;
    
    try {
      const res = await fetch(`/api/developer/keys/${id}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) throw new Error('Failed to revoke key');
      
      setKeys(keys.filter(k => k.id !== id));
      router.refresh();
    } catch (err) {
      alert(err);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">API Keys</h1>
          <p className="text-neutral-500 mt-1">Manage your platform API keys and resource scopes.</p>
        </div>
        <button 
          onClick={handleGenerate}
          disabled={isGenerating}
          className="bg-black text-white dark:bg-white dark:text-black px-4 py-2 rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
        >
          {isGenerating ? 'Generating...' : '+ Generate New Key'}
        </button>
      </div>

      {newKeyData && (
        <div className="bg-green-50 border border-green-200 text-green-900 p-4 rounded-lg mb-8 dark:bg-green-900/20 dark:border-green-900/30 dark:text-green-300">
          <h3 className="font-bold mb-2">Save your API key!</h3>
          <p className="mb-4 text-sm">This is the only time we will show you this key. Please save it securely.</p>
          <code className="block bg-white dark:bg-black p-3 rounded border border-green-200 dark:border-green-900 break-all select-all">
            {newKeyData.rawKey}
          </code>
        </div>
      )}

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800">
            <tr>
              <th className="px-6 py-4 font-medium text-sm text-neutral-500">NAME</th>
              <th className="px-6 py-4 font-medium text-sm text-neutral-500">PREFIX</th>
              <th className="px-6 py-4 font-medium text-sm text-neutral-500">SCOPES</th>
              <th className="px-6 py-4 font-medium text-sm text-neutral-500">CREATED</th>
              <th className="px-6 py-4 font-medium text-sm text-neutral-500 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {keys.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-neutral-500">
                  No API keys generated yet.
                </td>
              </tr>
            ) : (
              keys.map((key) => (
                <tr key={key.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                  <td className="px-6 py-4 font-medium">{key.name}</td>
                  <td className="px-6 py-4">
                    <code className="bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded text-sm text-neutral-600 dark:text-neutral-400">
                      {key.keyPrefix}...
                    </code>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {((key.scopes as string[]) || []).map(scope => (
                        <span key={scope} className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-full">
                          {scope}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-500">
                    {new Date(key.createdAt!).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleRevoke(key.id)}
                      className="text-red-500 hover:text-red-600 font-medium text-sm"
                    >
                      Revoke
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
