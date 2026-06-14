"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, BrainCircuit, Shield, Zap, Database, Activity, FileText, Search, Code, Blocks, Sparkles } from "lucide-react";
import { KnowledgeCore } from "../components/ui/KnowledgeCore";

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Track scroll progress across the massive container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  return (
    <div className="bg-[#020202] text-white font-sans selection:bg-violet-500/30 overflow-x-hidden">
      
      {/* Navbar (Fixed) */}
      <nav className="fixed top-0 z-50 w-full bg-transparent">
        <div className="flex items-center justify-between p-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="GenWorkAI" className="w-8 h-8 rounded-lg shadow-lg shadow-violet-500/20 object-cover" />
            <span className="text-xl font-bold tracking-tight text-white drop-shadow-md">GenWork<span className="text-violet-500">AI</span></span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors">Sign In</Link>
            <Link href="/signup" className="bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 px-5 py-2.5 rounded-xl text-sm font-bold transition-all">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* The Central Fixed Knowledge Core */}
      <KnowledgeCore scrollYProgress={scrollYProgress} />

      {/* Scrollable Story Container (Natural scrolling, no fading dead space) */}
      <div ref={containerRef} className="relative w-full z-10">
        
        {/* Stage 1: Hero */}
        <section className="min-h-[120vh] flex items-center justify-center relative w-full max-w-7xl mx-auto px-6">
          <div className="text-center bg-black/5 hover:bg-black/10 transition-colors duration-700 p-10 md:p-16 rounded-[3rem] backdrop-blur-md border border-white/5 shadow-2xl max-w-4xl w-full">
            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-zinc-300 mb-8 backdrop-blur-lg">
              <Sparkles className="w-4 h-4 text-cyan-400" /> 
              <span>Welcome to GenWorkAI 2.0</span>
            </div>
            
            <h1 className="text-6xl md:text-[6.5rem] font-black text-white mb-8 leading-[1.1] tracking-tighter">
              The Intelligent <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 drop-shadow-[0_0_40px_rgba(217,70,239,0.3)]">
                Nervous System.
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-zinc-300/80 font-medium max-w-2xl mx-auto leading-relaxed">
              Your entire company's logic—code, docs, and databases—transformed into a living, rotating neural graph that powers autonomous agents.
            </p>
          </div>
        </section>

        {/* Stage 2: Left Aligned */}
        <section className="min-h-screen flex items-center justify-start relative w-full max-w-7xl mx-auto px-6">
          <div className="bg-black/10 hover:bg-black/20 transition-all duration-500 p-10 md:p-14 rounded-[3rem] backdrop-blur-md border border-white/5 shadow-2xl max-w-2xl w-full">
            <div className="w-16 h-16 bg-violet-500/20 rounded-2xl flex items-center justify-center text-violet-400 mb-8">
              <Database className="w-8 h-8" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">Understand the <span className="text-fuchsia-400">Connections.</span></h2>
            <p className="text-xl text-zinc-300 leading-relaxed mb-6">
              Our AI instantly parses your complex repositories and documents into a semantic knowledge graph. 
              Nodes connect, code dependencies are mapped, and hidden relationships across your entire company are brought into the light.
            </p>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="text-sm text-zinc-400 font-bold uppercase tracking-widest mb-2">Network Capacity</div>
              <div className="text-3xl text-white font-bold">1.2M+ Neural Pathways</div>
            </div>
          </div>
        </section>

        {/* Stage 3: Right Aligned */}
        <section className="min-h-screen flex items-center justify-end relative w-full max-w-7xl mx-auto px-6">
          <div className="bg-black/10 hover:bg-black/20 transition-all duration-500 p-10 md:p-14 rounded-[3rem] backdrop-blur-md border border-white/5 shadow-2xl max-w-2xl w-full">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 mb-8">
              <BrainCircuit className="w-8 h-8" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">Build <span className="text-emerald-400">Structured Systems.</span></h2>
            <p className="text-xl text-zinc-300 leading-relaxed mb-6">
              Raw graphs reorganize into pure business logic. Define Features, Flows, and Architectures. 
              GenWorkAI links product requirements directly to the underlying source files automatically, keeping everything perfectly in sync.
            </p>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="text-sm text-zinc-400 font-bold uppercase tracking-widest mb-2">Data Sync</div>
              <div className="text-3xl text-white font-bold">Real-time GitHub Webhooks</div>
            </div>
          </div>
        </section>

        {/* Stage 4: Left Aligned */}
        <section className="min-h-screen flex items-center justify-start relative w-full max-w-7xl mx-auto px-6">
          <div className="bg-black/10 hover:bg-black/20 transition-all duration-500 p-10 md:p-14 rounded-[3rem] backdrop-blur-md border border-white/5 shadow-2xl max-w-2xl w-full">
            <div className="w-16 h-16 bg-orange-500/20 rounded-2xl flex items-center justify-center text-orange-400 mb-8">
              <FileText className="w-8 h-8" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">Generate <span className="text-orange-400">Professional Artifacts.</span></h2>
            <p className="text-xl text-zinc-300 leading-relaxed mb-6">
              Once your knowledge is structured, crystallize it into production-ready outputs. 
              Automatically generate Product Requirement Docs (PRDs), Architecture Diagrams, API Specifications, and full Postman Collections in mere seconds.
            </p>
          </div>
        </section>

      </div>

      {/* The Studios Grid (New robust content block) */}
      <section className="relative z-20 bg-black/10 backdrop-blur-md py-32 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Four Studios. One <span className="text-fuchsia-400">Ecosystem.</span></h2>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
              Everything you need to orchestrate knowledge, research, code, and documents in one unified operating system.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            
            {/* Knowledge Base */}
            <div className="bg-black/10 backdrop-blur-md border border-white/10 p-10 rounded-3xl group hover:border-violet-500/50 transition-colors">
              <div className="w-14 h-14 bg-violet-500/20 rounded-2xl flex items-center justify-center text-violet-400 mb-8 group-hover:scale-110 transition-transform">
                <Database className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Knowledge Base Studio</h3>
              <p className="text-zinc-400 leading-relaxed mb-6">
                Connect your Postgres DBs, scrape entire websites, sync GitHub repositories, and upload massive PDF batches. 
                Our neural engine automatically parses, chunks, and creates a living vector-graph of your business intelligence.
                Ask it anything, instantly.
              </p>
              <ul className="space-y-2 text-sm text-zinc-300">
                <li className="flex items-center gap-2"><div className="w-1 h-1 bg-violet-400 rounded-full" /> Auto-sync with GitHub main branch</li>
                <li className="flex items-center gap-2"><div className="w-1 h-1 bg-violet-400 rounded-full" /> Recursive website crawling</li>
                <li className="flex items-center gap-2"><div className="w-1 h-1 bg-violet-400 rounded-full" /> Postgres schema intelligence</li>
              </ul>
            </div>

            {/* Research Studio */}
            <div className="bg-gradient-to-br from-cyan-900/10 to-transparent border border-white/10 p-10 rounded-3xl backdrop-blur-sm group hover:border-cyan-500/50 transition-colors">
              <div className="w-14 h-14 bg-cyan-500/20 rounded-2xl flex items-center justify-center text-cyan-400 mb-8 group-hover:scale-110 transition-transform">
                <Search className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Research Studio</h3>
              <p className="text-zinc-400 leading-relaxed mb-6">
                Deploy autonomous multi-agent systems that scour the web, read scientific papers, and analyze market trends.
                Simply provide a prompt, and the Research Studio will compile citations, verify sources, and output comprehensive reports.
              </p>
              <ul className="space-y-2 text-sm text-zinc-300">
                <li className="flex items-center gap-2"><div className="w-1 h-1 bg-cyan-400 rounded-full" /> arXiv & PubMed deep integrations</li>
                <li className="flex items-center gap-2"><div className="w-1 h-1 bg-cyan-400 rounded-full" /> Live web browsing and scraping</li>
                <li className="flex items-center gap-2"><div className="w-1 h-1 bg-cyan-400 rounded-full" /> Automated citation generation</li>
              </ul>
            </div>

            {/* File Studio */}
            <div className="bg-gradient-to-br from-orange-900/10 to-transparent border border-white/10 p-10 rounded-3xl backdrop-blur-sm group hover:border-orange-500/50 transition-colors">
              <div className="w-14 h-14 bg-orange-500/20 rounded-2xl flex items-center justify-center text-orange-400 mb-8 group-hover:scale-110 transition-transform">
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">File Studio</h3>
              <p className="text-zinc-400 leading-relaxed mb-6">
                Turn your unstructured knowledge into structured, production-ready artifacts. 
                Generate fully-formatted Product Requirement Docs (PRDs), interactive API specs, Postman collections, 
                and comprehensive architecture diagrams in seconds.
              </p>
              <ul className="space-y-2 text-sm text-zinc-300">
                <li className="flex items-center gap-2"><div className="w-1 h-1 bg-orange-400 rounded-full" /> OpenAPI 3.0 generation</li>
                <li className="flex items-center gap-2"><div className="w-1 h-1 bg-orange-400 rounded-full" /> Mermaid.js diagrams</li>
                <li className="flex items-center gap-2"><div className="w-1 h-1 bg-orange-400 rounded-full" /> Markdown & PDF exports</li>
              </ul>
            </div>

            {/* MCP Builder */}
            <div className="bg-gradient-to-br from-emerald-900/10 to-transparent border border-white/10 p-10 rounded-3xl backdrop-blur-sm group hover:border-emerald-500/50 transition-colors">
              <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 mb-8 group-hover:scale-110 transition-transform">
                <Blocks className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">MCP Builder (Pro)</h3>
              <p className="text-zinc-400 leading-relaxed mb-6">
                Break your knowledge out of the dashboard. Compile your workspaces into custom Model Context Protocol (MCP) servers.
                Inject your entire company's context natively into your favorite IDEs like Cursor and VS Code, or directly into Claude Desktop.
              </p>
              <ul className="space-y-2 text-sm text-zinc-300">
                <li className="flex items-center gap-2"><div className="w-1 h-1 bg-emerald-400 rounded-full" /> Works in Cursor & Windsurf</li>
                <li className="flex items-center gap-2"><div className="w-1 h-1 bg-emerald-400 rounded-full" /> Natively supported by Claude</li>
                <li className="flex items-center gap-2"><div className="w-1 h-1 bg-emerald-400 rounded-full" /> Instant 1-click deployment</li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* Final CTA & Footer Section (Normal scroll from here) */}
      <section className="relative z-20 bg-black/10 backdrop-blur-md py-32 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 font-medium mb-8">
            <Shield className="w-4 h-4" /> Enterprise Grade Security
          </div>
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 leading-tight">
            Build Your <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400">
              AI Operating System
            </span>
          </h2>
          <p className="text-xl text-zinc-400 mb-12 max-w-2xl mx-auto">
            Stop pasting code snippets. Start building a unified, connected, and living knowledge ecosystem for your team and AI agents.
          </p>
          <Link href="/signup" className="inline-flex items-center justify-center gap-2 bg-white text-black px-10 py-5 rounded-2xl text-lg font-bold transition-transform hover:scale-105 shadow-[0_0_40px_rgba(255,255,255,0.3)]">
            Create Your Core <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Pricing Mini */}
        <div className="max-w-5xl mx-auto mt-32 grid md:grid-cols-2 gap-8">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
            <h3 className="text-2xl font-bold mb-2">Free Tier</h3>
            <p className="text-zinc-400 mb-8">Perfect for trying it out.</p>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-violet-500"/> 1 Knowledge Base</li>
              <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-violet-500"/> 10 Features/Flows</li>
              <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-violet-500"/> 50 Artifacts/mo</li>
            </ul>
          </div>
          <div className="bg-gradient-to-br from-violet-900/40 to-fuchsia-900/40 border border-violet-500/30 rounded-3xl p-8 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/20 blur-[50px]" />
            <h3 className="text-2xl font-bold mb-2">Pro Tier</h3>
            <p className="text-violet-200 mb-8">For serious builders and teams.</p>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-fuchsia-400"/> Unlimited Knowledge Bases</li>
              <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-fuchsia-400"/> Unlimited Flows & Artifacts</li>
              <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-fuchsia-400"/> MCP Builder Unlocked</li>
            </ul>
          </div>
        </div>

        <div className="max-w-4xl mx-auto mt-32 pt-12 border-t border-white/10 flex flex-col md:flex-row items-center justify-between text-zinc-500 text-sm">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-5 h-5" /> GenWorkAI &copy; {new Date().getFullYear()}
          </div>
          <div className="flex gap-6 mt-4 md:mt-0">
            <Link href="/login" className="hover:text-white transition-colors">Login</Link>
            <Link href="/signup" className="hover:text-white transition-colors">Sign Up</Link>
          </div>
        </div>
      </section>

    </div>
  );
}
