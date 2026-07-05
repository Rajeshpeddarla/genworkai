"use client";

import { 
  Key, 
  Plus, 
  Copy, 
  Eye, 
  EyeOff, 
  Trash2,
  ShieldAlert,
  AlertCircle
} from "lucide-react";
import { useState } from "react";

export default function ApiKeysPage() {
  const [showKey, setShowKey] = useState<string | null>(null);

  const keys = [
    { id: "1", name: "Production App Sync", prefix: "gw_prod_...", created: "Oct 12, 2026", lastUsed: "2 mins ago" },
    { id: "2", name: "Local Development", prefix: "gw_dev_...", created: "Oct 14, 2026", lastUsed: "Yesterday" },
    { id: "3", name: "Zapier Integration", prefix: "gw_prod_...", created: "Oct 20, 2026", lastUsed: "Never" },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <div className="p-2 bg-yellow-500/10 text-yellow-400 rounded-lg border border-yellow-500/20">
              <Key className="w-6 h-6" />
            </div>
            API Keys
          </h1>
          <p className="text-zinc-400 mt-1">Manage your API keys for programmatic access to GenWorkAI.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-600 text-white font-semibold hover:bg-yellow-500 transition-colors shadow-lg shadow-yellow-600/20">
            <Plus className="w-4 h-4" /> Create New Key
          </button>
        </div>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-200/80 leading-relaxed">
          <span className="font-semibold text-amber-400 block mb-1">Keep your keys secure</span>
          Do not share your API keys in publicly accessible areas such as GitHub, client-side code, and so forth. If a key is compromised, delete it immediately and generate a new one.
        </div>
      </div>

      <div className="bg-card/50 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-black/20 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                <th className="p-4 pl-6">Name</th>
                <th className="p-4">Key</th>
                <th className="p-4">Created</th>
                <th className="p-4">Last Used</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {keys.map((key) => (
                <tr key={key.id} className="hover:bg-white/5 transition-colors group">
                  <td className="p-4 pl-6">
                    <div className="font-medium text-white text-sm">{key.name}</div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <code className="px-2 py-1 bg-black/40 rounded text-xs text-yellow-400 font-mono border border-white/5">
                        {showKey === key.id ? "gw_prod_8f9a2b4c6d..." : key.prefix + "••••••••"}
                      </code>
                      <button 
                        onClick={() => setShowKey(showKey === key.id ? null : key.id)}
                        className="text-zinc-500 hover:text-white transition-colors"
                      >
                        {showKey === key.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button className="text-zinc-500 hover:text-white transition-colors">
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-zinc-400">{key.created}</td>
                  <td className="p-4 text-sm text-zinc-400">{key.lastUsed}</td>
                  <td className="p-4 pr-6 text-right">
                    <button className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
