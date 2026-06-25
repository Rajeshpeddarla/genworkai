import { createClient } from '../../../../utils/supabase/server';
import { redirect } from 'next/navigation';
import { Book, Copy } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function DeveloperDocsPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  let openapi: any = null;
  try {
    const host = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${host}/api/openapi.json`, { cache: 'no-store' });
    if (res.ok) openapi = await res.json();
  } catch (err) {}

  const endpoints = openapi?.paths ? Object.entries(openapi.paths).flatMap(([path, methods]: [string, any]) => 
    Object.keys(methods).map(method => ({ path, method, details: methods[method] }))
  ) : [];

  return (
    <div className="p-8 lg:p-12 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">API Documentation</h1>
          <p className="text-neutral-500">Comprehensive reference for all GenWorkAI endpoints.</p>
        </div>
        <button className="bg-neutral-900 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-black">
          <Copy className="w-4 h-4" /> Copy API Spec for AI
        </button>
      </div>

      <div className="grid gap-12">
        {endpoints.map((ep, idx) => (
          <div key={idx} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-8 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <span className={`px-3 py-1 rounded font-bold font-mono text-sm uppercase ${
                ep.method === 'get' ? 'bg-green-100 text-green-700' :
                ep.method === 'post' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {ep.method}
              </span>
              <h2 className="text-xl font-mono font-bold text-neutral-800 dark:text-neutral-200">{ep.path}</h2>
              <div className="flex-1"></div>
              <Link href="/developer/playground" className="text-violet-600 hover:text-violet-700 text-sm font-bold bg-violet-50 dark:bg-violet-900/20 px-4 py-1.5 rounded-lg">
                Test in Playground &rarr;
              </Link>
            </div>

            <p className="text-neutral-600 dark:text-neutral-400 mb-8 max-w-3xl">
              {ep.details.summary || 'Execute an operation against the GenWorkAI platform.'}
            </p>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-bold border-b border-neutral-200 dark:border-neutral-800 pb-2 mb-4">Request Parameters</h3>
                {ep.path.includes('{') ? (
                  <ul className="space-y-3">
                    {ep.path.match(/\\{([^}]+)\\}/g)?.map(match => {
                      const param = match.replace(/[{}]/g, '');
                      return (
                        <li key={param} className="flex gap-4 items-start">
                          <code className="bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-sm text-pink-600">{param}</code>
                          <span className="text-sm text-neutral-500">Required string. The ID of the resource.</span>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-sm text-neutral-500 italic">No path parameters required.</p>
                )}

                {ep.method !== 'get' && (
                  <>
                    <h3 className="font-bold border-b border-neutral-200 dark:border-neutral-800 pb-2 mb-4 mt-8">Request Body</h3>
                    <pre className="bg-neutral-50 dark:bg-black p-4 rounded-lg font-mono text-xs text-neutral-700 dark:text-neutral-300 overflow-x-auto border border-neutral-200 dark:border-neutral-800">
                      {JSON.stringify(ep.details.requestBody?.content?.['application/json']?.schema || { type: "object" }, null, 2)}
                    </pre>
                  </>
                )}
              </div>

              <div>
                <h3 className="font-bold border-b border-neutral-200 dark:border-neutral-800 pb-2 mb-4">Authentication</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                  Requires <code className="bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-pink-600">Bearer</code> token in Authorization header.
                </p>

                <h3 className="font-bold border-b border-neutral-200 dark:border-neutral-800 pb-2 mb-4 mt-8">Response</h3>
                <pre className="bg-neutral-50 dark:bg-black p-4 rounded-lg font-mono text-xs text-neutral-700 dark:text-neutral-300 overflow-x-auto border border-neutral-200 dark:border-neutral-800">
                  {JSON.stringify(ep.details.responses?.['200']?.content?.['application/json']?.schema || { success: true, data: {} }, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}