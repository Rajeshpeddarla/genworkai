"use client";

import { useState } from "react";
import { 
  MonitorPlay,
  Play,
  Camera,
  MessageCircle,
  Briefcase,
  Users,
  Image as ImageIcon,
  Link as LinkIcon,
  Search,
  CheckCircle2,
  AlertTriangle,
  PlaySquare,
  Box,
  Building2,
  Code2,
  Lightbulb,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  History,
  FileText,
  Clock
} from "lucide-react";

export default function MediaIntelligencePage() {
  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setShowResult(true);
    }, 2500);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 text-orange-400 rounded-lg border border-orange-500/20">
              <MonitorPlay className="w-6 h-6" />
            </div>
            Media Intelligence
          </h1>
          <p className="text-zinc-400 mt-1">Deep analysis and fact-checking for videos, social media, and images.</p>
        </div>
      </div>

      {!showResult ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-6">
          <div className="lg:col-span-2 space-y-8">
            {/* Main Input Card */}
            <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-8 lg:p-12 relative overflow-hidden backdrop-blur-sm">
              <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="text-center mb-8 relative z-10">
                <h2 className="text-2xl font-bold text-white mb-2">Analyze Any Media Content</h2>
                <p className="text-zinc-400">Paste a link to a video, social post, or upload an image to extract products, technologies, and fact-check claims.</p>
              </div>

              <form onSubmit={handleAnalyze} className="relative z-10 space-y-6 max-w-2xl mx-auto">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <LinkIcon className="h-5 w-5 text-zinc-500 group-focus-within:text-orange-400 transition-colors" />
                  </div>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="block w-full rounded-2xl border-0 py-5 pl-14 pr-36 bg-black/40 text-white ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-orange-500 sm:text-lg sm:leading-6 placeholder:text-zinc-600 transition-all shadow-inner"
                    placeholder="Paste URL (YouTube, Reels, TikTok...)"
                  />
                  <div className="absolute inset-y-2 right-2 flex items-center">
                    <button
                      type="submit"
                      disabled={isAnalyzing || !url}
                      className="flex items-center gap-2 rounded-xl bg-orange-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-600/20 hover:bg-orange-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {isAnalyzing ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        "Analyze Media"
                      )}
                    </button>
                  </div>
                </div>
              </form>

              <div className="mt-12 grid grid-cols-3 sm:grid-cols-6 gap-4 relative z-10">
                {[
                  { icon: Play, color: "text-red-500", name: "YouTube" },
                  { icon: Camera, color: "text-pink-500", name: "Instagram" },
                  { icon: PlaySquare, color: "text-zinc-100", name: "TikTok" }, 
                  { icon: MessageCircle, color: "text-blue-400", name: "X (Twitter)" },
                  { icon: Briefcase, color: "text-blue-600", name: "LinkedIn" },
                  { icon: Users, color: "text-blue-500", name: "Facebook" },
                ].map((platform) => (
                  <div key={platform.name} className="flex flex-col items-center justify-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer">
                    <platform.icon className={`w-8 h-8 ${platform.color} opacity-70 hover:opacity-100 transition-opacity`} />
                    <span className="text-[10px] font-medium">{platform.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <History className="w-4 h-4 text-orange-400" /> Recent Analyses
              </h3>
              <div className="space-y-3">
                {[
                  { title: "Apple Vision Pro Review", source: "YouTube", date: "2 hrs ago" },
                  { title: "React 19 Features Draft", source: "Twitter", date: "5 hrs ago" },
                  { title: "Startup Pitch Deck 2026", source: "Image", date: "1 day ago" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 cursor-pointer transition-colors group">
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-zinc-400 group-hover:text-orange-400 transition-colors">
                      <MonitorPlay className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-zinc-200">{item.title}</div>
                      <div className="text-[10px] text-zinc-500">{item.source} • {item.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Analysis Results View */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          <div className="lg:col-span-2 space-y-6">
            {/* Top Overview Card */}
            <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
              <div className="flex items-start gap-4 mb-6 pb-6 border-b border-white/10">
                <div className="w-32 h-20 rounded-lg bg-zinc-800 shrink-0 relative overflow-hidden border border-white/10 flex items-center justify-center">
                  <Play className="w-8 h-8 text-white/50" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-500/10 text-red-400 text-xs font-semibold mb-2">
                    <Play className="w-3 h-3" /> YouTube Video
                  </div>
                  <h2 className="text-xl font-bold text-white leading-tight mb-2">Next.js 16 Full Course 2026: Build and Deploy a Full Stack App</h2>
                  <p className="text-sm text-zinc-400">Processed in 18 seconds • Extracted 14,203 words from speech</p>
                </div>
              </div>

              {/* Summary */}
              <div className="mb-8">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-400" /> AI Summary
                </h3>
                <p className="text-zinc-300 leading-relaxed text-sm">
                  This 4-hour tutorial covers the newly released Next.js 16 features, specifically focusing on the advanced Turbopack integrations, server actions optimizations, and the new Edge database drivers. The creator builds a complete SaaS application including Stripe billing and Auth.js.
                </p>
              </div>

              {/* Deep Research & Fact Check */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5">
                  <h4 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" /> Fact Check Passed
                  </h4>
                  <ul className="text-sm text-zinc-300 space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Next.js 16 is indeed out of beta (Verified via Vercel blog)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Turbopack is now the default for dev and build.</span>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5">
                  <h4 className="text-sm font-bold text-amber-400 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Corrections / Notes
                  </h4>
                  <ul className="text-sm text-zinc-300 space-y-2">
                    <li className="flex items-start gap-2">
                      <div className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 mt-0.5 text-[10px]">!</div>
                      <span>The tutorial mentions Auth.js v5, but v6 was released yesterday.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 mt-0.5 text-[10px]">!</div>
                      <span>Pricing mentioned for Stripe is outdated for EU users.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            
            {/* Timestamps & Transcripts snippet */}
            <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
               <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-400" /> Key Moments
                </h3>
                <div className="space-y-3">
                  <div className="flex gap-4 p-3 hover:bg-white/5 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-white/5">
                    <div className="text-blue-400 font-mono text-sm font-medium pt-0.5">14:23</div>
                    <div>
                      <div className="font-medium text-zinc-200">Server Actions Architecture</div>
                      <div className="text-sm text-zinc-400 line-clamp-1">Here is how you structure mutations with the new useActionState hook...</div>
                    </div>
                  </div>
                  <div className="flex gap-4 p-3 hover:bg-white/5 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-white/5">
                    <div className="text-blue-400 font-mono text-sm font-medium pt-0.5">1:02:45</div>
                    <div>
                      <div className="font-medium text-zinc-200">Implementing the Edge Database</div>
                      <div className="text-sm text-zinc-400 line-clamp-1">Now we will connect to Neon DB using their serverless driver...</div>
                    </div>
                  </div>
                </div>
            </div>
          </div>

          <div className="space-y-6">
            
            {/* Extracted Entities */}
            <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-5">Detected Entities</h3>
              
              <div className="space-y-5">
                <div>
                  <div className="flex items-center gap-2 text-zinc-400 mb-2 text-sm font-medium">
                    <Code2 className="w-4 h-4" /> Technologies
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-zinc-800 border border-white/10 text-xs text-zinc-300">Next.js 16</span>
                    <span className="px-2.5 py-1 rounded-lg bg-zinc-800 border border-white/10 text-xs text-zinc-300">React 19</span>
                    <span className="px-2.5 py-1 rounded-lg bg-zinc-800 border border-white/10 text-xs text-zinc-300">Turbopack</span>
                    <span className="px-2.5 py-1 rounded-lg bg-zinc-800 border border-white/10 text-xs text-zinc-300">Tailwind CSS</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-zinc-400 mb-2 text-sm font-medium">
                    <Building2 className="w-4 h-4" /> Companies
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-zinc-800 border border-white/10 text-xs text-zinc-300">Vercel</span>
                    <span className="px-2.5 py-1 rounded-lg bg-zinc-800 border border-white/10 text-xs text-zinc-300">Stripe</span>
                    <span className="px-2.5 py-1 rounded-lg bg-zinc-800 border border-white/10 text-xs text-zinc-300">Neon</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-zinc-400 mb-2 text-sm font-medium">
                    <Box className="w-4 h-4" /> Products Mentioned
                  </div>
                  <div className="flex flex-col gap-2">
                    <a href="#" className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5 text-sm">
                      <span className="text-blue-400">Auth.js</span>
                      <ExternalLink className="w-3 h-3 text-zinc-500" />
                    </a>
                    <a href="#" className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5 text-sm">
                      <span className="text-blue-400">Stripe Checkout</span>
                      <ExternalLink className="w-3 h-3 text-zinc-500" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Related Context */}
            <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-orange-400" /> Trend Signals
              </h3>
              <p className="text-xs text-zinc-400 mb-4">GenWorkAI cross-referenced this video with recent social trends.</p>
              
              <div className="space-y-3">
                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <div className="text-sm font-medium text-white mb-1">Shift to Server Components</div>
                  <div className="text-xs text-zinc-400">Mentions of RSCs in tutorials have increased 300% this quarter.</div>
                </div>
              </div>
            </div>

            <button 
              onClick={() => {
                setShowResult(false);
                setUrl("");
              }}
              className="w-full py-3 rounded-xl border border-white/10 text-sm font-medium text-white hover:bg-white/5 transition-colors"
            >
              Analyze Another Link
            </button>
          </div>

        </div>
      )}
    </div>
  );
}