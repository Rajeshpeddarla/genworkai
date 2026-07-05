"use client";

import { 
  LayoutTemplate, 
  Search, 
  Download, 
  Star, 
  Users, 
  ServerCog, 
  MessageSquare,
  Filter,
  TrendingUp,
  Award
} from "lucide-react";

export default function TemplatesPage() {
  const templates = [
    {
      id: 1,
      title: "GitHub Repo Deep Dive MCP",
      author: "GenWorkAI Team",
      type: "MCP Server",
      downloads: "12.4k",
      rating: "4.9",
      desc: "Connects to any GitHub repo and builds a semantic index for deep code understanding and architecture explanation.",
      icon: ServerCog,
      color: "text-violet-400",
      bg: "bg-violet-500/10"
    },
    {
      id: 2,
      title: "Competitor Analysis Report",
      author: "MarketIntel",
      type: "Prompt Flow",
      downloads: "8.2k",
      rating: "4.8",
      desc: "A 5-step prompt template that takes 3 competitor URLs and generates a comprehensive SWOT analysis and market position matrix.",
      icon: MessageSquare,
      color: "text-blue-400",
      bg: "bg-blue-500/10"
    },
    {
      id: 3,
      title: "Podcast to Newsletter",
      author: "CreatorTools",
      type: "Workflow",
      downloads: "5.1k",
      rating: "4.7",
      desc: "Automated workflow that takes a YouTube podcast link, extracts the transcript, and generates a formatted weekly newsletter.",
      icon: LayoutTemplate,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10"
    },
    {
      id: 4,
      title: "Financial Earnings Extraction",
      author: "FinTech Bros",
      type: "MCP Server",
      downloads: "3.2k",
      rating: "4.9",
      desc: "MCP Server configured to scrape SEC filings and extract key financial metrics into standardized JSON formats.",
      icon: ServerCog,
      color: "text-violet-400",
      bg: "bg-violet-500/10"
    },
    {
      id: 5,
      title: "Product Launch Tweet Thread",
      author: "SocialGenius",
      type: "Prompt Flow",
      downloads: "15.8k",
      rating: "4.6",
      desc: "Upload your product documentation and generate a viral 10-part Twitter/X thread for your upcoming launch.",
      icon: MessageSquare,
      color: "text-blue-400",
      bg: "bg-blue-500/10"
    },
    {
      id: 6,
      title: "Customer Support Triaging",
      author: "SupportOps",
      type: "Workflow",
      downloads: "2.1k",
      rating: "4.8",
      desc: "Connects to Zendesk/Intercom exports, categorizes tickets by sentiment and urgency, and drafts initial responses.",
      icon: LayoutTemplate,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg border border-rose-500/20">
              <LayoutTemplate className="w-6 h-6" />
            </div>
            Community Templates
          </h1>
          <p className="text-zinc-400 mt-1">Discover and share MCP servers, prompt flows, and workflows.</p>
        </div>
      </div>

      {/* Featured Banner */}
      <div className="bg-gradient-to-r from-rose-600 to-fuchsia-600 rounded-3xl p-8 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold mb-4 backdrop-blur-md">
            <Award className="w-4 h-4" /> Template of the Month
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Automated Pitch Deck Analyzer</h2>
          <p className="text-white/80 mb-6 line-clamp-2">Upload any PDF pitch deck and instantly receive a VC-style memo evaluating the team, market size, competition, and financial projections.</p>
          <button className="px-6 py-2.5 rounded-xl bg-white text-rose-600 font-bold hover:bg-zinc-100 transition-colors shadow-lg">
            Install Template
          </button>
        </div>
        <div className="relative z-10 hidden md:block">
          <TrendingUp className="w-32 h-32 text-white/20" />
        </div>
      </div>

      <div className="flex items-center gap-4 border-b border-white/10 pb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Search templates..." 
            className="w-full bg-card/50 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all"
          />
        </div>
        <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 transition-colors text-zinc-300">
          <Filter className="w-4 h-4" /> All Categories
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div key={template.id} className="bg-card/50 border border-white/10 rounded-3xl p-6 backdrop-blur-sm group hover:border-rose-500/50 transition-all flex flex-col relative">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl ${template.bg} border border-white/5 flex items-center justify-center`}>
                <template.icon className={`w-6 h-6 ${template.color}`} />
              </div>
              <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-md text-xs text-amber-400 font-medium">
                <Star className="w-3 h-3 fill-amber-400" /> {template.rating}
              </div>
            </div>
            
            <div className="mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1 block">{template.type}</span>
              <h3 className="text-lg font-bold text-white leading-tight">{template.title}</h3>
            </div>
            
            <p className="text-sm text-zinc-400 line-clamp-3 mb-6 flex-1">
              {template.desc}
            </p>
            
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/10">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span className="text-white font-medium">@{template.author}</span>
                <span>•</span>
                <span className="flex items-center gap-1"><Download className="w-3 h-3" /> {template.downloads}</span>
              </div>
              <button className="p-2 bg-white/5 hover:bg-rose-500 hover:text-white text-zinc-300 rounded-lg transition-colors">
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
