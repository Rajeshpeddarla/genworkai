"use client";

import { 
  Trash2, 
  RotateCcw, 
  Search, 
  FileText, 
  MessageSquare, 
  ServerCog, 
  AlertTriangle 
} from "lucide-react";

export default function TrashPage() {
  const trashedItems = [
    { id: 1, name: "Draft Pitch Deck V1.pdf", type: "Document", deletedAt: "2 hours ago", daysLeft: 29, icon: FileText, color: "text-blue-400" },
    { id: 2, name: "Q1 Marketing Brainstorm", type: "Chat", deletedAt: "Yesterday", daysLeft: 28, icon: MessageSquare, color: "text-violet-400" },
    { id: 3, name: "Legacy Internal Wiki Auth", type: "MCP Server", deletedAt: "5 days ago", daysLeft: 25, icon: ServerCog, color: "text-emerald-400" },
    { id: 4, name: "old_logo_concept.png", type: "Image", deletedAt: "28 days ago", daysLeft: 2, icon: FileText, color: "text-pink-400" },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <div className="p-2 bg-red-500/10 text-red-400 rounded-lg border border-red-500/20">
              <Trash2 className="w-6 h-6" />
            </div>
            Trash
          </h1>
          <p className="text-zinc-400 mt-1">Items in trash will be permanently deleted after 30 days.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-red-400 font-semibold hover:bg-red-500/10 hover:border-red-500/30 transition-colors">
            Empty Trash
          </button>
        </div>
      </div>

      <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
        <div className="text-sm text-red-200/80 leading-relaxed">
          <span className="font-semibold text-red-400 block mb-1">Permanent Deletion Warning</span>
          Items permanently deleted from the trash cannot be recovered. Ensure you have backed up any critical data before manually emptying the trash.
        </div>
      </div>

      <div className="flex items-center gap-4 border-b border-white/10 pb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Search trash..." 
            className="w-full bg-card/50 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all"
          />
        </div>
      </div>

      <div className="bg-card/50 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-black/20 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                <th className="p-4 pl-6">Name</th>
                <th className="p-4">Deleted</th>
                <th className="p-4">Retention</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {trashedItems.map((item) => (
                <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                        <item.icon className={`w-4 h-4 ${item.color}`} />
                      </div>
                      <div>
                        <div className="font-medium text-white text-sm">{item.name}</div>
                        <div className="text-xs text-zinc-500">{item.type}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-zinc-400">{item.deletedAt}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${item.daysLeft <= 5 ? 'bg-red-500' : 'bg-emerald-500'}`} 
                          style={{ width: `${(item.daysLeft / 30) * 100}%` }}
                        />
                      </div>
                      <span className={`text-xs ${item.daysLeft <= 5 ? 'text-red-400 font-bold' : 'text-zinc-500'}`}>
                        {item.daysLeft} days
                      </span>
                    </div>
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors" title="Restore">
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete Permanently">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {trashedItems.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-zinc-500">
                    Your trash is empty.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
