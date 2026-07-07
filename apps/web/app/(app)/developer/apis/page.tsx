'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function CustomApiDashboard() {
  const [apis, setApis] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchApis = async () => {
      try {
        const res = await fetch('/api/developer/apis');
        const json = await res.json();
        if (json.success && json.apis) {
          setApis(json.apis);
        }
      } catch (err) {
        console.error('Failed to load APIs', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchApis();
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Custom APIs</h1>
          <p className="text-neutral-500 mt-2">Build, manage, and monitor your custom AI endpoints.</p>
        </div>
        <Link 
          href="/developer/apis/builder"
          className="bg-black dark:bg-white text-white dark:text-black px-6 py-2.5 rounded-xl font-medium hover:opacity-90 transition-opacity"
        >
          Create New API
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-1 md:col-span-3 py-12 text-center text-neutral-500">
            Loading APIs...
          </div>
        ) : apis.length === 0 ? (
          <div className="col-span-1 md:col-span-3 border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900 p-8 text-center">
            <div className="w-16 h-16 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-zap"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg>
            </div>
            <h3 className="text-lg font-bold mb-2">No APIs created yet</h3>
            <p className="text-neutral-500 max-w-md mx-auto mb-6">You can turn any Knowledge Base or Workflow into a highly-scalable REST endpoint instantly.</p>
            <Link 
              href="/developer/apis/builder"
              className="text-violet-600 dark:text-violet-400 font-medium hover:underline"
            >
              Start building →
            </Link>
          </div>
        ) : (
          apis.map(api => (
            <Link 
              key={api.id}
              href={`/developer/apis/${api.slug}`}
              className="block border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900 p-6 hover:shadow-lg transition-shadow group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-xl flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-600 dark:text-neutral-400"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                </div>
                <div className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs font-bold px-2 py-1 rounded uppercase">
                  {api.method || 'POST'}
                </div>
              </div>
              
              <h3 className="text-xl font-bold mb-1 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">{api.name}</h3>
              <p className="text-sm text-neutral-500 mb-4 font-mono truncate">/api/v1/{api.slug}</p>
              
              <div className="flex gap-2">
                <span className="text-xs bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded text-neutral-600 dark:text-neutral-400">
                  {api.workflow?.length || 0} Steps
                </span>
                <span className="text-xs bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded text-neutral-600 dark:text-neutral-400">
                  {api.knowledgeSources?.length || 0} KBs
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
