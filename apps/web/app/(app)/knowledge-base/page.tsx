"use client";

import { useState } from "react";
import { 
  BrainCircuit, 
  Search, 
  Folder, 
  Hash, 
  Plus, 
  MoreVertical,
  FileText,
  Video,
  Globe,
  MessageSquare,
  Sparkles,
  Command,
  Filter
} from "lucide-react";

export default function KnowledgeBasePage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6 pb-6">
      
      {/* Left Sidebar - Collections & Tags */}
      <div className="w-64 shrink-0 flex flex-col gap-6 hidden lg:flex">
        
        {/* Semantic Search Promo */}
        <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/20 rounded-full blur-xl"></div>
          <Sparkles className="w-6 h-6 mb-3 relative z-10" />
          <h3 className="font-bold mb-1 relative z-10">AI Retrieval</h3>
          <p className="text-xs text-white/80 leading-relaxed relative z-10">
            Press <kbd className="px-1.5 py-0.5 bg-black/20 rounded border border-black/10 mx-0.5">⌘</kbd> + <kbd className="px-1.5 py-0.5 bg-black/20 rounded border border-black/10 mx-0.5">K</kbd> to ask your knowledge base anything using semantic search.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Collections */}
          <div>
            <div className="flex items-center justify-between text-zinc-400 mb-3 px-2">
              <span className="text-xs font-bold uppercase tracking-wider">Collections</span>
              <button className="hover:text-white"><Plus className="w-4 h-4" /></button>
            </div>
            <div className="space-y-1">
              {['Q3 Planning', 'Competitor Intel', 'Engineering Docs', 'Marketing Assets', 'Meeting Notes'].map((col) => (
                <button key={col} className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-zinc-300 hover:bg-white/5 hover:text-white transition-colors group">
                  <span className="flex items-center gap-2 truncate">
                    <Folder className="w-4 h-4 text-zinc-500 group-hover:text-blue-400 transition-colors shrink-0" />
                    <span className="truncate">{col}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <div className="flex items-center justify-between text-zinc-400 mb-3 px-2">
              <span className="text-xs font-bold uppercase tracking-wider">Tags</span>
              <button className="hover:text-white"><Plus className="w-4 h-4" /></button>
            </div>
            <div className="flex flex-wrap gap-2 px-2">
              {['react', 'finance', 'q3', 'urgent', 'draft', 'design', 'research'].map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 border border-white/10 text-xs text-zinc-400 cursor-pointer hover:bg-white/10 hover:text-white transition-colors">
                  <Hash className="w-3 h-3" /> {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-zinc-900/50 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-sm">
        
        {/* Top Search Bar */}
        <div className="h-16 border-b border-white/10 flex items-center px-6 gap-4 bg-black/20">
          <BrainCircuit className="w-6 h-6 text-fuchsia-500 shrink-0" />
          <div className="relative flex-1">
            <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search or ask your knowledge base..."
              className="w-full bg-transparent border-0 pl-8 pr-4 py-2 text-white focus:ring-0 placeholder:text-zinc-500"
            />
          </div>
          <button className="flex items-center gap-2 text-xs font-medium text-zinc-400 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/10 hover:text-white transition-colors shrink-0">
            <Filter className="w-3 h-3" /> Filter
          </button>
        </div>

        {/* Content Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white">All Items</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-500">2,401 items</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            
            {/* Item 1: Document */}
            <div className="bg-black/20 border border-white/5 rounded-2xl p-4 hover:border-white/20 transition-all cursor-pointer group">
              <div className="flex justify-between items-start mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <FileText className="w-5 h-5" />
                </div>
                <button className="text-zinc-500 hover:text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
              <h3 className="font-semibold text-white mb-1 line-clamp-1">Q3 Financial Projections.pdf</h3>
              <p className="text-xs text-zinc-500 mb-4 line-clamp-2">Revenue forecasts and budget allocations for the upcoming EU expansion.</p>
              <div className="flex items-center justify-between mt-auto">
                <div className="flex gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] bg-white/5 text-zinc-400 border border-white/5">finance</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-white/5 text-zinc-400 border border-white/5">q3</span>
                </div>
                <span className="text-[10px] text-zinc-600">2h ago</span>
              </div>
            </div>

            {/* Item 2: Report */}
            <div className="bg-black/20 border border-white/5 rounded-2xl p-4 hover:border-fuchsia-500/30 transition-all cursor-pointer group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-fuchsia-500/5 rounded-full blur-xl"></div>
              <div className="flex justify-between items-start mb-3 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center text-fuchsia-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <button className="text-zinc-500 hover:text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
              <h3 className="font-semibold text-white mb-1 line-clamp-1 relative z-10">AI Agents Market Report</h3>
              <p className="text-xs text-zinc-500 mb-4 line-clamp-2 relative z-10">Generated research report analyzing 14 competitor repositories and 3 SEC filings.</p>
              <div className="flex items-center justify-between mt-auto relative z-10">
                <div className="flex gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] bg-white/5 text-zinc-400 border border-white/5">research</span>
                </div>
                <span className="text-[10px] text-zinc-600">Yesterday</span>
              </div>
            </div>

            {/* Item 3: Website */}
            <div className="bg-black/20 border border-white/5 rounded-2xl p-4 hover:border-emerald-500/30 transition-all cursor-pointer group">
              <div className="flex justify-between items-start mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Globe className="w-5 h-5" />
                </div>
                <button className="text-zinc-500 hover:text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
              <h3 className="font-semibold text-white mb-1 line-clamp-1">Stripe API Documentation</h3>
              <p className="text-xs text-zinc-500 mb-4 line-clamp-2">Complete scrape of Stripe Checkout APIs for the engineering team context.</p>
              <div className="flex items-center justify-between mt-auto">
                <div className="flex gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] bg-white/5 text-zinc-400 border border-white/5">engineering</span>
                </div>
                <span className="text-[10px] text-zinc-600">3 days ago</span>
              </div>
            </div>

            {/* Item 4: Chat */}
            <div className="bg-black/20 border border-white/5 rounded-2xl p-4 hover:border-violet-500/30 transition-all cursor-pointer group">
              <div className="flex justify-between items-start mb-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <button className="text-zinc-500 hover:text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
              <h3 className="font-semibold text-white mb-1 line-clamp-1">Pricing Page Copywriting Chat</h3>
              <p className="text-xs text-zinc-500 mb-4 line-clamp-2">Ideation session with Claude 3.5 for the new enterprise pricing tiers.</p>
              <div className="flex items-center justify-between mt-auto">
                <div className="flex gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] bg-white/5 text-zinc-400 border border-white/5">marketing</span>
                </div>
                <span className="text-[10px] text-zinc-600">Last week</span>
              </div>
            </div>

             {/* Item 5: Video */}
            <div className="bg-black/20 border border-white/5 rounded-2xl p-4 hover:border-orange-500/30 transition-all cursor-pointer group">
              <div className="flex justify-between items-start mb-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                  <Video className="w-5 h-5" />
                </div>
                <button className="text-zinc-500 hover:text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
              <h3 className="font-semibold text-white mb-1 line-clamp-1">All-Hands Meeting Rec</h3>
              <p className="text-xs text-zinc-500 mb-4 line-clamp-2">Transcribed and summarized internal meeting regarding the Q4 roadmap.</p>
              <div className="flex items-center justify-between mt-auto">
                <div className="flex gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] bg-white/5 text-zinc-400 border border-white/5">internal</span>
                </div>
                <span className="text-[10px] text-zinc-600">Last week</span>
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}