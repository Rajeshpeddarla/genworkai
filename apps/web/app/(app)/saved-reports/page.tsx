"use client";

import { useState } from "react";
import { 
  Bookmark, 
  Search, 
  Filter, 
  FileBarChart, 
  Download, 
  MoreVertical,
  Calendar,
  Globe,
  MonitorPlay,
  Building2,
  Trash2,
  Share2
} from "lucide-react";

export default function SavedReportsPage() {
  const [activeFilter, setActiveFilter] = useState("all");

  const filters = [
    { id: "all", name: "All Reports", icon: FileBarChart },
    { id: "research", name: "Research Reports", icon: FileBarChart },
    { id: "media", name: "Media Reports", icon: MonitorPlay },
    { id: "website", name: "Website Reports", icon: Globe },
    { id: "competitor", name: "Competitor Reports", icon: Building2 },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <div className="p-2 bg-pink-500/10 text-pink-400 rounded-lg border border-pink-500/20">
              <Bookmark className="w-6 h-6" />
            </div>
            Saved Reports
          </h1>
          <p className="text-zinc-400 mt-1">Your central repository of generated AI intelligence.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Sidebar Filters */}
        <div className="w-full md:w-64 shrink-0 space-y-6">
          <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-4 backdrop-blur-sm space-y-2">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4 px-2">Filters</h3>
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  activeFilter === filter.id 
                    ? "bg-pink-500/10 text-pink-400 border border-pink-500/20" 
                    : "text-zinc-400 hover:bg-white/5 hover:text-white border border-transparent"
                }`}
              >
                <filter.icon className="w-4 h-4" /> {filter.name}
              </button>
            ))}
          </div>

          <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-4 backdrop-blur-sm space-y-4">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider px-2">Export Options</h3>
            <div className="grid grid-cols-3 gap-2 px-2">
              <button className="flex flex-col items-center justify-center gap-2 p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-zinc-400 hover:text-white group">
                <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                <span className="text-[10px] font-bold">PDF</span>
              </button>
              <button className="flex flex-col items-center justify-center gap-2 p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-zinc-400 hover:text-white group">
                <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                <span className="text-[10px] font-bold">DOCX</span>
              </button>
              <button className="flex flex-col items-center justify-center gap-2 p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-zinc-400 hover:text-white group">
                <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                <span className="text-[10px] font-bold">MD</span>
              </button>
            </div>
            <p className="text-[10px] text-zinc-500 text-center mt-2 px-2">Select a report to export</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search reports..." 
              className="w-full bg-zinc-900/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none transition-all shadow-inner"
            />
          </div>

          <div className="bg-zinc-900/50 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-sm">
            
            {/* Report Row */}
            <div className="flex items-center justify-between p-6 hover:bg-white/5 transition-colors border-b border-white/10 group cursor-pointer">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shrink-0 shadow-lg shadow-pink-500/20 text-white">
                  <FileBarChart className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1 group-hover:text-pink-400 transition-colors">AI Agents Market Landscape Q3</h3>
                  <p className="text-sm text-zinc-400 line-clamp-1 mb-2 max-w-2xl">
                    Comprehensive analysis of 14 competitor repositories and 3 SEC filings focusing on memory architectures and multi-agent orchestration.
                  </p>
                  <div className="flex items-center gap-4 text-xs text-zinc-500">
                    <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Oct 24, 2026</span>
                    <span className="flex items-center gap-1.5 px-2 py-0.5 bg-white/5 rounded-md border border-white/10">Research Report</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors" title="Export">
                  <Download className="w-4 h-4" />
                </button>
                <button className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors" title="Share">
                  <Share2 className="w-4 h-4" />
                </button>
                <button className="p-2 bg-white/10 hover:bg-red-500/20 hover:text-red-400 text-zinc-400 rounded-lg transition-colors" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Report Row */}
            <div className="flex items-center justify-between p-6 hover:bg-white/5 transition-colors border-b border-white/10 group cursor-pointer">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0 text-orange-400">
                  <MonitorPlay className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1 group-hover:text-orange-400 transition-colors">Apple Vision Pro Reviews Sentiment</h3>
                  <p className="text-sm text-zinc-400 line-clamp-1 mb-2 max-w-2xl">
                    Media intelligence report summarizing sentiment from 5 major tech YouTube channels regarding the visionOS 2.0 update.
                  </p>
                  <div className="flex items-center gap-4 text-xs text-zinc-500">
                    <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Oct 22, 2026</span>
                    <span className="flex items-center gap-1.5 px-2 py-0.5 bg-white/5 rounded-md border border-white/10">Media Report</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors" title="Export">
                  <Download className="w-4 h-4" />
                </button>
                <button className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors" title="Share">
                  <Share2 className="w-4 h-4" />
                </button>
                <button className="p-2 bg-white/10 hover:bg-red-500/20 hover:text-red-400 text-zinc-400 rounded-lg transition-colors" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Report Row */}
            <div className="flex items-center justify-between p-6 hover:bg-white/5 transition-colors group cursor-pointer">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 text-blue-400">
                  <Globe className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">Vercel v0 Capabilities Extraction</h3>
                  <p className="text-sm text-zinc-400 line-clamp-1 mb-2 max-w-2xl">
                    Fact check and feature breakdown based on the public documentation and marketing pages.
                  </p>
                  <div className="flex items-center gap-4 text-xs text-zinc-500">
                    <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Oct 15, 2026</span>
                    <span className="flex items-center gap-1.5 px-2 py-0.5 bg-white/5 rounded-md border border-white/10">Website Report</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors" title="Export">
                  <Download className="w-4 h-4" />
                </button>
                <button className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors" title="Share">
                  <Share2 className="w-4 h-4" />
                </button>
                <button className="p-2 bg-white/10 hover:bg-red-500/20 hover:text-red-400 text-zinc-400 rounded-lg transition-colors" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>

          <div className="flex justify-center pt-4">
            <button className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium text-white transition-colors">
              Load More
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}