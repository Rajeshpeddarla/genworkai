'use client';

import { useState, useEffect } from 'react';
import { History, Search, ArrowRight, RefreshCw, Filter } from 'lucide-react';
import Link from 'next/link';

export default function DeveloperLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('gk_playground_history');
    if (saved) {
      setLogs(JSON.parse(saved));
    }
    setLoading(false);
  }, []);

  return (
    <div className="p-8 lg:p-12 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Request Logs</h1>
          <p className="text-neutral-500">View your recent API requests and replay them in the playground.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input 
              type="text" 
              placeholder="Search logs..." 
              className="pl-9 pr-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black text-sm outline-none focus:ring-2 focus:ring-violet-500 w-64"
            />
          </div>
          <button className="p-2 border border-neutral-200 dark:border-neutral-800 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-neutral-500 flex flex-col items-center gap-4">
            <RefreshCw className="w-8 h-8 animate-spin" />
            <p>Loading logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-6">
              <History className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">No logs found</h3>
            <p className="text-neutral-500 mb-6 max-w-md">Your API request history will appear here. Head over to the playground to make your first request.</p>
            <Link href="/developer/playground" className="bg-violet-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-violet-700 transition-colors">
              Go to Playground
            </Link>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800">
              <tr>
                <th className="px-6 py-4 font-bold text-neutral-500">Method</th>
                <th className="px-6 py-4 font-bold text-neutral-500">Path</th>
                <th className="px-6 py-4 font-bold text-neutral-500">Status</th>
                <th className="px-6 py-4 font-bold text-neutral-500">Time</th>
                <th className="px-6 py-4 font-bold text-neutral-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {logs.map((log, idx) => (
                <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold">
                    <span className={`px-2 py-1 rounded text-xs ${
                      log.method.toLowerCase() === 'get' ? 'bg-green-100 text-green-700' :
                      log.method.toLowerCase() === 'post' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {log.method.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-neutral-600 dark:text-neutral-400 truncate max-w-xs">{log.url}</td>
                  <td className="px-6 py-4">
                    <span className={`flex items-center gap-1.5 font-mono font-bold ${
                      log.status >= 200 && log.status < 300 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${log.status >= 200 && log.status < 300 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-neutral-500">{new Date(log.time).toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">
                    <Link href="/developer/playground" className="text-violet-600 hover:text-violet-700 font-medium inline-flex items-center gap-1">
                      Replay <ArrowRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}