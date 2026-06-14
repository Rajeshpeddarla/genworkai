"use client";

import { 
  Puzzle, 
  AppWindow, 
  Settings, 
  BarChart3, 
  Download, 
  FileText, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  MessageSquare,
  ServerCog,
  CheckCircle2,
  Database,
  Globe,
  Video
} from "lucide-react";

export default function ExtensionDashboardPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <div className="p-2 bg-zinc-800 text-zinc-100 rounded-lg border border-zinc-700">
              <Puzzle className="w-6 h-6" />
            </div>
            Browser Extension
          </h1>
          <p className="text-zinc-400 mt-1">Manage your GenWorkAI extension settings, analytics, and extracted assets.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-500 transition-colors shadow-lg">
            <AppWindow className="w-4 h-4" /> Install Extension
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Status & Analytics */}
        <div className="space-y-6">
          
          {/* Extension Status */}
          <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-6 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <AppWindow className="w-32 h-32" />
            </div>
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)] animate-pulse" />
              <h2 className="text-lg font-bold text-white">Extension Active</h2>
            </div>
            <p className="text-sm text-zinc-400 mb-6 relative z-10">
              Version 2.4.1 is currently installed and syncing data to your GenWorkAI workspace.
            </p>
            <div className="flex gap-2 relative z-10">
              <button className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
                <Settings className="w-4 h-4" /> Preferences
              </button>
              <button className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
                <Download className="w-4 h-4" /> Export Data
              </button>
            </div>
          </div>

          {/* Analytics */}
          <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-6 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> Extension Analytics
            </h3>
            
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-end mb-2">
                  <div className="text-sm font-medium text-zinc-300">Pages Analyzed</div>
                  <div className="text-2xl font-bold text-white">0</div>
                </div>
                <div className="w-full bg-white/5 rounded-full h-1.5">
                  <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '0%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-end mb-2">
                  <div className="text-sm font-medium text-zinc-300">Assets Extracted</div>
                  <div className="text-2xl font-bold text-white">0</div>
                </div>
                <div className="w-full bg-white/5 rounded-full h-1.5">
                  <div className="bg-fuchsia-500 h-1.5 rounded-full" style={{ width: '0%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-2">
                  <div className="text-sm font-medium text-zinc-300">MCPs Created</div>
                  <div className="text-2xl font-bold text-white">0</div>
                </div>
                <div className="w-full bg-white/5 rounded-full h-1.5">
                  <div className="bg-violet-500 h-1.5 rounded-full" style={{ width: '0%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Capabilities & Recent Assets */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Capabilities Grid */}
          <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
             <h2 className="text-xl font-bold text-white mb-6">Extension Capabilities</h2>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { name: "Current Page Analysis", icon: Globe, color: "text-blue-400" },
                  { name: "Chat with Page", icon: MessageSquare, color: "text-violet-400" },
                  { name: "Create MCP", icon: ServerCog, color: "text-emerald-400" },
                  { name: "Extract Text & Tables", icon: FileText, color: "text-amber-400" },
                  { name: "Extract Images", icon: ImageIcon, color: "text-pink-400" },
                  { name: "Save to Workspace", icon: Database, color: "text-zinc-300" },
                ].map((cap) => (
                  <div key={cap.name} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-3">
                    <cap.icon className={`w-6 h-6 ${cap.color}`} />
                    <span className="text-sm font-medium text-zinc-200">{cap.name}</span>
                  </div>
                ))}
             </div>
          </div>

          {/* Recent Extractions */}
          <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
             <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Recently Extracted</h2>
                <button className="text-sm text-blue-400 hover:text-blue-300">View All</button>
             </div>

             <div className="space-y-4">
                {/* Item 1 */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 text-blue-400">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-medium text-white text-sm">Financial Data Table</h4>
                      <p className="text-xs text-zinc-400 mt-1 flex items-center gap-2">
                        <LinkIcon className="w-3 h-3" /> SEC.gov • Extracted 2h ago
                      </p>
                    </div>
                  </div>
                  <button className="px-3 py-1.5 rounded-lg bg-white/10 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">Open</button>
                </div>

                {/* Item 2 */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center shrink-0 text-pink-400">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-medium text-white text-sm">Product Screenshots (12)</h4>
                      <p className="text-xs text-zinc-400 mt-1 flex items-center gap-2">
                        <LinkIcon className="w-3 h-3" /> Stripe.com • Extracted yesterday
                      </p>
                    </div>
                  </div>
                  <button className="px-3 py-1.5 rounded-lg bg-white/10 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">Open</button>
                </div>

                {/* Item 3 */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-400">
                      <ServerCog className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-medium text-white text-sm">Wiki Documentation MCP</h4>
                      <p className="text-xs text-zinc-400 mt-1 flex items-center gap-2">
                        <LinkIcon className="w-3 h-3" /> Internal Wiki • Created 2 days ago
                      </p>
                    </div>
                  </div>
                  <button className="px-3 py-1.5 rounded-lg bg-white/10 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">Open</button>
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}