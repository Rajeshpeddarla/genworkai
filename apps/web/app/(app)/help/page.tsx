"use client";

import { 
  LifeBuoy, 
  Search, 
  BookOpen, 
  MessageCircle, 
  PlayCircle, 
  FileCode2, 
  ArrowRight,
  ExternalLink
} from "lucide-react";

export default function HelpPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      
      {/* Header Area with Search */}
      <div className="bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border border-blue-500/20 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <div className="w-16 h-16 mx-auto bg-blue-500/20 rounded-2xl flex items-center justify-center border border-blue-500/30 mb-6 shadow-xl shadow-blue-500/20">
            <LifeBuoy className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight">How can we help you today?</h1>
          <p className="text-blue-200 text-lg">Search our documentation, tutorials, and community forums.</p>
          
          <div className="relative max-w-2xl mx-auto mt-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-blue-400/50" />
            <input 
              type="text" 
              placeholder="Search for 'How to create an MCP' or 'Billing issue'..." 
              className="w-full bg-black/40 border border-blue-500/30 rounded-2xl py-4 pl-14 pr-6 text-lg text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 outline-none transition-all shadow-inner placeholder:text-blue-200/40"
            />
          </div>
        </div>
      </div>

      {/* Main Support Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-6 backdrop-blur-sm group hover:border-blue-500/50 transition-all cursor-pointer">
          <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 mb-4 border border-blue-500/20 group-hover:scale-110 transition-transform">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Documentation</h3>
          <p className="text-sm text-zinc-400 mb-4 line-clamp-2">Detailed guides on features, settings, and workspace configuration.</p>
          <div className="text-blue-400 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
            Read Docs <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-6 backdrop-blur-sm group hover:border-indigo-500/50 transition-all cursor-pointer">
          <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 mb-4 border border-indigo-500/20 group-hover:scale-110 transition-transform">
            <PlayCircle className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Video Tutorials</h3>
          <p className="text-sm text-zinc-400 mb-4 line-clamp-2">Step-by-step video courses from beginner to advanced workflows.</p>
          <div className="text-indigo-400 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
            Watch Now <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-6 backdrop-blur-sm group hover:border-violet-500/50 transition-all cursor-pointer">
          <div className="w-12 h-12 bg-violet-500/10 rounded-xl flex items-center justify-center text-violet-400 mb-4 border border-violet-500/20 group-hover:scale-110 transition-transform">
            <FileCode2 className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">API & Developers</h3>
          <p className="text-sm text-zinc-400 mb-4 line-clamp-2">API references, SDKs, and guides for building custom integrations.</p>
          <div className="text-violet-400 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
            Developer Hub <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-6 backdrop-blur-sm group hover:border-emerald-500/50 transition-all cursor-pointer">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 mb-4 border border-emerald-500/20 group-hover:scale-110 transition-transform">
            <MessageCircle className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Community</h3>
          <p className="text-sm text-zinc-400 mb-4 line-clamp-2">Join our Discord, ask questions, and share your GenWorkAI templates.</p>
          <div className="text-emerald-400 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
            Join Discord <ExternalLink className="w-4 h-4" />
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6">
        
        {/* Popular Articles */}
        <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
          <h2 className="text-xl font-bold text-white mb-6">Popular Articles</h2>
          <div className="space-y-4">
            {[
              "Getting Started: First 10 Minutes with GenWorkAI",
              "How to build a Custom MCP Server",
              "Understanding Knowledge Base Semantic Search",
              "Best Practices for Video Intelligence Extraction",
              "Managing Team Roles and Workspace Access"
            ].map((article, i) => (
              <a key={i} href="#" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-colors group">
                <BookOpen className="w-5 h-5 text-zinc-500 group-hover:text-blue-400" />
                <span className="text-zinc-300 group-hover:text-white font-medium text-sm">{article}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Contact Support */}
        <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-8 backdrop-blur-sm flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6">
            <LifeBuoy className="w-8 h-8 text-zinc-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Still need help?</h2>
          <p className="text-zinc-400 mb-8 max-w-sm">Our support team is available 24/7. Pro plan users receive priority routing.</p>
          <button className="px-8 py-3 rounded-xl bg-white text-black font-bold hover:bg-zinc-200 transition-colors shadow-lg">
            Contact Support
          </button>
        </div>

      </div>
    </div>
  );
}
