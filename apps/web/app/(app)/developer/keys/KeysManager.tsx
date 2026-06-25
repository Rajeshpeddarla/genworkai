'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Entitlements {
  hasApiAccess: boolean;
  apiAccessReason?: string;
  keysLimit: number;
  currentKeyCount: number;
  upgradeRequired?: boolean;
}

export default function KeysManager({ initialKeys, entitlements }: { initialKeys: any[], entitlements: Entitlements }) {
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
      
      const data = await res.json();
      
      if (!res.ok) {
        if (data.upgradeRequired) {
          alert(`Upgrade Required: ${data.message}`);
          router.push('/billing');
          return;
        }
        throw new Error(data.message || data.error || 'Failed to generate key');
      }
      
      setKeys([data.key, ...keys]);
      setNewKeyData(data);
      router.refresh();
    } catch (err: any) {
      alert(err.message || err);
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
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to revoke key');
      
      // Update local state to show as revoked
      setKeys(keys.map(k => k.id === id ? { ...k, status: 'revoked' } : k));
      router.refresh();
    } catch (err: any) {
      alert(err.message || err);
    }
  };

  // Dashboard calculations
  const { hasApiAccess, keysLimit, currentKeyCount } = entitlements;
  const isUnlimited = keysLimit === -1;
  const usagePercentage = isUnlimited ? 0 : Math.min(100, Math.round((currentKeyCount / (keysLimit || 1)) * 100));
  const canGenerate = hasApiAccess && (isUnlimited || currentKeyCount < keysLimit);

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">API Keys</h1>
          <p className="text-neutral-500 mt-1">Manage your platform API keys and resource scopes.</p>
        </div>
        <button 
          onClick={handleGenerate}
          disabled={isGenerating || !canGenerate}
          className="bg-black text-white dark:bg-white dark:text-black px-4 py-2 rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
        >
          {isGenerating ? 'Generating...' : '+ Generate New Key'}
        </button>
      </div>

      {/* Dashboard Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-xl">
          <h3 className="text-sm font-medium text-neutral-500 mb-4">API Access Status</h3>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${hasApiAccess ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="font-medium">{hasApiAccess ? 'Enabled' : 'Disabled'}</span>
          </div>
          {!hasApiAccess && (
            <p className="text-sm text-red-500 mt-2">{entitlements.apiAccessReason}</p>
          )}
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-xl">
          <div className="flex justify-between items-end mb-2">
            <h3 className="text-sm font-medium text-neutral-500">API Key Usage</h3>
            <span className="font-medium">
              {currentKeyCount} / {isUnlimited ? '∞' : keysLimit} Used
            </span>
          </div>
          {!isUnlimited && (
            <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2.5">
              <div 
                className={`h-2.5 rounded-full ${usagePercentage >= 100 ? 'bg-red-500' : 'bg-black dark:bg-white'}`} 
                style={{ width: `${usagePercentage}%` }}
              ></div>
            </div>
          )}
          {!isUnlimited && usagePercentage >= 100 && (
            <p className="text-sm text-red-500 mt-2">API Key limit reached. Revoke keys or upgrade your plan.</p>
          )}
        </div>
      </div>

      {!hasApiAccess && (
        <div className="bg-neutral-100 dark:bg-neutral-800 p-4 rounded-lg mb-8 flex justify-between items-center">
          <div>
            <h3 className="font-bold">Upgrade to Pro</h3>
            <p className="text-sm text-neutral-500">Unlock API access, higher limits, and advanced features.</p>
          </div>
          <Link href="/billing" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700">
            View Plans
          </Link>
        </div>
      )}

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
              <th className="px-6 py-4 font-medium text-sm text-neutral-500">STATUS</th>
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
                    {key.status === 'active' ? (
                      <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    ) : (
                      <span className="text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded-full">
                        Revoked
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-500">
                    {new Date(key.createdAt!).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {key.status === 'active' && (
                      <button 
                        onClick={() => handleRevoke(key.id)}
                        className="text-red-500 hover:text-red-600 font-medium text-sm"
                      >
                        Revoke
                      </button>
                    )}
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
