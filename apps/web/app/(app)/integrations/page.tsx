"use client";

import { 
  Blocks, 
  Code2 as Github, 
  MessageSquare as Slack, 
  PenTool as Figma, 
  PlaySquare as Youtube, 
  Search,
  CheckCircle2,
  Plug,
  Plus,
  ArrowRight
} from "lucide-react";

export default function IntegrationsPage() {
  const integrations = [
    { name: "GitHub", icon: Github, desc: "Sync repositories for code context.", connected: true, color: "text-white" },
    { name: "Google Drive", icon: Blocks, desc: "Import Docs, Sheets, and Slides.", connected: true, color: "text-blue-400" },
    { name: "Notion", icon: Blocks, desc: "Sync workspace pages and databases.", connected: true, color: "text-zinc-100" },
    { name: "Slack", icon: Slack, desc: "GenWorkAI bot for channel summaries.", connected: false, color: "text-pink-500" },
    { name: "Discord", icon: Blocks, desc: "Community management and Q&A bot.", connected: false, color: "text-indigo-400" },
    { name: "Linear", icon: Blocks, desc: "Sync issues and project states.", connected: false, color: "text-violet-500" },
    { name: "Jira", icon: Blocks, desc: "Enterprise issue tracking sync.", connected: false, color: "text-blue-500" },
    { name: "Figma", icon: Figma, desc: "Design file analysis and extraction.", connected: false, color: "text-orange-500" },
    { name: "YouTube", icon: Youtube, desc: "Channel sync for video transcripts.", connected: false, color: "text-red-500" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
              <Plug className="w-6 h-6" />
            </div>
            Integrations
          </h1>
          <p className="text-zinc-400 mt-1">Connect your tools to build powerful AI workflows and MCPs.</p>
        </div>
      </div>

      <div className="flex items-center gap-4 border-b border-white/10 pb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Search integrations..." 
            className="w-full bg-zinc-900/50 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        
        {integrations.map((app) => (
          <div key={app.name} className="bg-zinc-900/50 border border-white/10 rounded-3xl p-6 backdrop-blur-sm group hover:border-indigo-500/50 transition-all flex flex-col relative overflow-hidden">
            {app.connected && (
              <div className="absolute top-0 right-0 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Connected
              </div>
            )}
            
            <div className={`w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 ${app.color}`}>
              <app.icon className="w-6 h-6" />
            </div>
            
            <h3 className="text-lg font-bold text-white mb-1">{app.name}</h3>
            <p className="text-sm text-zinc-400 mb-6 flex-1">{app.desc}</p>
            
            {app.connected ? (
              <button className="w-full py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-medium text-white hover:bg-white/10 transition-colors">
                Configure
              </button>
            ) : (
              <button className="w-full py-2 rounded-xl bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Connect
              </button>
            )}
          </div>
        ))}

        {/* Custom Webhook / API */}
        <div className="bg-zinc-900/30 border-2 border-dashed border-white/10 hover:border-indigo-500/50 rounded-3xl p-6 backdrop-blur-sm flex flex-col items-center justify-center text-center cursor-pointer group transition-all">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-indigo-500/10 transition-all">
            <Blocks className="w-6 h-6 text-zinc-500 group-hover:text-indigo-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Custom API & Webhooks</h3>
          <p className="text-sm text-zinc-400 mb-4 px-2">Build custom integrations using our REST API.</p>
          <div className="text-sm font-medium text-indigo-400 group-hover:text-indigo-300 flex items-center gap-1">
            View Docs <ArrowRight className="w-4 h-4" />
          </div>
        </div>

      </div>
    </div>
  );
}
