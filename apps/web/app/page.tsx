"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  ArrowRight, BrainCircuit, Shield, Zap, Database, 
  FileText, Search, Code, Blocks, Sparkles, Server, 
  TerminalSquare, CheckCircle2, XCircle, LayoutDashboard, Activity
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="bg-[#020202] text-white font-sans selection:bg-violet-500/30 overflow-x-hidden min-h-screen">
      
      {/* Navbar (Fixed) */}
      <nav className="fixed top-0 z-50 w-full bg-black/50 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center justify-between p-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="GenWorkAI" className="w-8 h-8 rounded-lg shadow-lg shadow-violet-500/20 object-cover" />
            <span className="text-xl font-bold tracking-tight text-white drop-shadow-md">GenWork<span className="text-violet-500">AI</span></span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-400">
            <Link href="#features" className="hover:text-white transition-colors">Features</Link>
            <Link href="#workflow" className="hover:text-white transition-colors">Workflow</Link>
            <Link href="#use-cases" className="hover:text-white transition-colors">Use Cases</Link>
            <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors">Sign In</Link>
            <Link href="/signup" className="bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 px-4 py-2 rounded-xl text-sm font-bold transition-all">
              Start Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 max-w-7xl mx-auto text-center relative">
        
        {/* Animated Background Grid & Neurons */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none w-full flex justify-center">
          {/* Mask that fades out gracefully at bottom and completely fades out at left/right edges */}
          <div className="absolute inset-0 w-full h-[120%] [mask-image:radial-gradient(ellipse_60%_100%_at_50%_0%,#000_10%,transparent_80%)]">
            {/* The Grid itself */}
            <motion.div
              animate={{ backgroundPosition: ["0px 0px", "0px 40px"] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              className="absolute inset-0 w-full h-full bg-[linear-gradient(to_right,rgba(139,92,246,0.2)_1px,transparent_1px),linear-gradient(to_bottom,rgba(34,211,238,0.2)_1px,transparent_1px)] bg-[size:40px_40px]"
            />
            
            {/* Horizontal Neurons (synced to vertical grid scrolling) */}
            <motion.div 
              animate={{ y: [0, 40] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              className="absolute inset-0"
            >
              <motion.div
                animate={{ left: ["-20%", "120%"] }}
                transition={{ repeat: Infinity, duration: 3, ease: "linear", delay: 0 }}
                className="absolute top-[120px] w-[30%] h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] opacity-80"
              />
              <motion.div
                animate={{ left: ["120%", "-20%"] }}
                transition={{ repeat: Infinity, duration: 4.5, ease: "linear", delay: 1 }}
                className="absolute top-[280px] w-[40%] h-[2px] bg-gradient-to-r from-transparent via-violet-400 to-transparent shadow-[0_0_15px_#8b5cf6] opacity-80"
              />
              <motion.div
                animate={{ left: ["-20%", "120%"] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "linear", delay: 2.5 }}
                className="absolute top-[440px] w-[20%] h-[2px] bg-gradient-to-r from-transparent via-fuchsia-400 to-transparent shadow-[0_0_15px_#d946ef] opacity-80"
              />
            </motion.div>

            {/* Vertical Neurons (static lines, fixed exact grid multiples) */}
            <motion.div
              animate={{ top: ["-20%", "120%"] }}
              transition={{ repeat: Infinity, duration: 5, ease: "linear", delay: 0.5 }}
              className="absolute left-[160px] h-[40%] w-[2px] bg-gradient-to-b from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] opacity-80"
            />
            <motion.div
              animate={{ top: ["120%", "-20%"] }}
              transition={{ repeat: Infinity, duration: 6, ease: "linear", delay: 1.5 }}
              className="absolute left-[640px] h-[30%] w-[2px] bg-gradient-to-b from-transparent via-violet-400 to-transparent shadow-[0_0_15px_#8b5cf6] opacity-80"
            />
            <motion.div
              animate={{ top: ["-20%", "120%"] }}
              transition={{ repeat: Infinity, duration: 4, ease: "linear", delay: 3 }}
              className="absolute left-[1280px] h-[50%] w-[2px] bg-gradient-to-b from-transparent via-fuchsia-400 to-transparent shadow-[0_0_15px_#d946ef] opacity-80"
            />
            <motion.div
              animate={{ top: ["120%", "-20%"] }}
              transition={{ repeat: Infinity, duration: 3.5, ease: "linear", delay: 2 }}
              className="absolute left-[1800px] h-[25%] w-[2px] bg-gradient-to-b from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] opacity-80"
            />
          </div>
        </div>

        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3], rotate: [0, 90, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-violet-600/20 blur-[120px] rounded-full pointer-events-none z-0" 
        />
        
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-zinc-300 mb-8 backdrop-blur-lg relative z-10">
          <Sparkles className="w-4 h-4 text-cyan-400" /> 
          <span>GenWorkAI is now in Early Access</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-black text-white mb-8 leading-[1.1] tracking-tighter relative z-10">
          Build Applications <br className="hidden md:block"/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400">
            From Knowledge.
          </span>
        </h1>

        <p className="text-xl md:text-2xl text-zinc-400 max-w-3xl mx-auto mb-12 leading-relaxed relative z-10">
          Turn repositories, databases, documents, websites, and business knowledge into APIs, MCP servers, streaming endpoints, and application-ready intelligence.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20 relative z-10">
          <Link href="/signup" className="w-full sm:w-auto bg-white text-black px-8 py-4 rounded-xl text-lg font-bold transition-transform hover:scale-105 shadow-[0_0_40px_rgba(255,255,255,0.2)]">
            Start Building Free
          </Link>
          <Link href="/contact" className="w-full sm:w-auto bg-white/10 border border-white/20 text-white px-8 py-4 rounded-xl text-lg font-bold transition-transform hover:scale-105 backdrop-blur-md">
            Book a Demo
          </Link>
        </div>

        {/* Hero Visual Flow Diagram */}
        <div className="bg-black/40 border border-white/10 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
            {/* Inputs */}
            <div className="flex flex-col gap-4 w-full md:w-1/3">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4"><Code className="text-blue-400 w-6 h-6"/> GitHub Repositories</div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4"><Database className="text-emerald-400 w-6 h-6"/> Databases</div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4"><FileText className="text-orange-400 w-6 h-6"/> Documents</div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4"><Zap className="text-yellow-400 w-6 h-6"/> Websites</div>
            </div>

            {/* Core */}
            <div className="flex-shrink-0 relative">
              <ArrowRight className="w-8 h-8 text-violet-500 absolute -left-12 top-1/2 -translate-y-1/2 hidden md:block z-10" />

              <div className="relative">
                <div className="w-48 h-48 rounded-full p-[2px] bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center relative shadow-[0_0_60px_rgba(139,92,246,0.6)] z-10">
                  <div className="w-full h-full bg-[#020202] rounded-full flex flex-col items-center justify-center relative overflow-hidden">
                    <BrainCircuit className="w-12 h-12 text-white mb-2 relative z-10" />
                    <span className="font-bold text-sm relative z-10 text-center">Knowledge<br/>Engine</span>
                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay"></div>
                  </div>
                </div>
              </div>

              <ArrowRight className="w-8 h-8 text-fuchsia-500 absolute -right-12 top-1/2 -translate-y-1/2 hidden md:block z-10" />
            </div>

            {/* Outputs */}
            <div className="flex flex-col gap-4 w-full md:w-1/3">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4"><Server className="text-cyan-400 w-6 h-6"/> APIs</div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4"><Blocks className="text-violet-400 w-6 h-6"/> MCP Servers</div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4"><Activity className="text-pink-400 w-6 h-6"/> Streaming</div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4"><LayoutDashboard className="text-indigo-400 w-6 h-6"/> Applications</div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem & Solution */}
      <section className="py-24 bg-zinc-950 px-6 border-y border-white/5">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Your Knowledge Is <span className="text-red-400">Trapped</span>.</h2>
            <p className="text-zinc-400 mb-6 text-lg">
              Modern teams store knowledge everywhere: GitHub repositories, databases, stored procedures, SOPs, PDFs, and internal wikis. Finding the right information takes hours.
            </p>
            <div className="space-y-4 mb-8">
              <p className="font-medium text-zinc-300">Teams repeatedly ask:</p>
              <ul className="space-y-3 text-sm text-zinc-500">
                <li className="flex gap-3 items-center"><XCircle className="w-5 h-5 text-red-500/50" /> Which API should I call?</li>
                <li className="flex gap-3 items-center"><XCircle className="w-5 h-5 text-red-500/50" /> Which stored procedure is used?</li>
                <li className="flex gap-3 items-center"><XCircle className="w-5 h-5 text-red-500/50" /> Where is this business logic implemented?</li>
              </ul>
            </div>
            <p className="text-zinc-400 italic">The answers already exist. They are just impossible to discover quickly.</p>
          </div>

          <div className="bg-gradient-to-br from-violet-900/20 to-fuchsia-900/20 p-10 rounded-3xl border border-violet-500/20">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Turn Knowledge Into <span className="text-violet-400">Intelligence</span>.</h2>
            <p className="text-zinc-300 mb-8 text-lg">
              GenWorkAI connects your repositories, databases, documents, and websites into a unified intelligence layer.
            </p>
            <ul className="space-y-4 text-zinc-300">
              <li className="flex items-center gap-3"><CheckCircle2 className="w-6 h-6 text-emerald-400" /> Ask questions in natural language.</li>
              <li className="flex items-center gap-3"><CheckCircle2 className="w-6 h-6 text-emerald-400" /> Generate standard APIs automatically.</li>
              <li className="flex items-center gap-3"><CheckCircle2 className="w-6 h-6 text-emerald-400" /> Expose Context via MCP servers.</li>
              <li className="flex items-center gap-3"><CheckCircle2 className="w-6 h-6 text-emerald-400" /> Build applications from the same knowledge.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">The Intelligence Layer</h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-colors">
            <Code className="w-10 h-10 text-blue-400 mb-6" />
            <h3 className="text-2xl font-bold mb-4">Repository Intelligence</h3>
            <p className="text-zinc-400">Connect GitHub repositories and instantly understand APIs, microservices, component trees, business logic, and data models without reading code.</p>
          </div>

          <div className="bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-colors">
            <Database className="w-10 h-10 text-emerald-400 mb-6" />
            <h3 className="text-2xl font-bold mb-4">Database Intelligence</h3>
            <p className="text-zinc-400">Connect Postgres, MySQL, SQL Server, or MongoDB. Generate complex SQL, documentation, table explanations, and schema relationship mappings instantly.</p>
          </div>

          <div className="bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-colors">
            <Server className="w-10 h-10 text-cyan-400 mb-6" />
            <h3 className="text-2xl font-bold mb-4">Knowledge APIs</h3>
            <p className="text-zinc-400">Transform knowledge into ready-to-use REST APIs like <code className="bg-black/50 px-2 py-1 rounded text-xs text-cyan-300">GET /api/search</code> or <code className="bg-black/50 px-2 py-1 rounded text-xs text-cyan-300">GET /api/query</code>. Build apps without retraining models.</p>
          </div>

          <div className="bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-colors">
            <Blocks className="w-10 h-10 text-violet-400 mb-6" />
            <h3 className="text-2xl font-bold mb-4">MCP Servers</h3>
            <p className="text-zinc-400">Expose your entire company's knowledge to Claude, ChatGPT, Cursor, VS Code, and AI Agents through secure Model Context Protocol endpoints.</p>
          </div>

          <div className="bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-colors">
            <Activity className="w-10 h-10 text-pink-400 mb-6" />
            <h3 className="text-2xl font-bold mb-4">Streaming Responses</h3>
            <p className="text-zinc-400">Deliver real-time streaming knowledge to mobile apps, websites, internal dashboards, and chat interfaces over Server-Sent Events (SSE).</p>
          </div>

          <div className="bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-colors">
            <FileText className="w-10 h-10 text-orange-400 mb-6" />
            <h3 className="text-2xl font-bold mb-4">Report Generation</h3>
            <p className="text-zinc-400">Automatically compile and generate PDF Reports, DOCX Product Documents, Markdown documentation, and complex Research Reports from your data sources.</p>
          </div>
        </div>
      </section>

      {/* Developer Workflow */}
      <section id="workflow" className="py-24 bg-black px-6 border-y border-white/5">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Build Once. <span className="text-cyan-400">Use Everywhere.</span></h2>
          <p className="text-xl text-zinc-400 mb-16">The ultimate developer workflow for AI integration.</p>

          <div className="flex flex-col md:flex-row justify-between items-center relative">
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-white/10 -translate-y-1/2 z-0" />
            
            {[
              { step: 1, title: "Connect GitHub" },
              { step: 2, title: "Connect Database" },
              { step: 3, title: "Upload Docs" },
              { step: 4, title: "AI Generation", highlight: true },
              { step: 5, title: "Build Apps" }
            ].map((item, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center mb-8 md:mb-0">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold border-4 mb-4 ${
                  item.highlight 
                  ? 'bg-violet-600 border-violet-400 shadow-[0_0_30px_rgba(139,92,246,0.6)]' 
                  : 'bg-black border-white/20'
                }`}>
                  {item.step}
                </div>
                <span className={`font-semibold ${item.highlight ? 'text-violet-400' : 'text-zinc-400'}`}>{item.title}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases & Example Queries */}
      <section id="use-cases" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16">
          
          {/* Left: Use Cases */}
          <div>
            <h2 className="text-4xl font-bold mb-10">Built For <span className="text-fuchsia-400">Scale.</span></h2>
            
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">For Developers</h3>
                <p className="text-zinc-400">Build apps powered by knowledge. Create internal tools, customer support apps, and search platforms—without managing vector databases.</p>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">For Engineering Teams</h3>
                <p className="text-zinc-400">Find answers instantly. Discover existing APIs, stored procedures, services, and tables without waiting for another team.</p>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">For Startups</h3>
                <p className="text-zinc-400">Turn product knowledge into developer APIs. Create platforms others can build on immediately.</p>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">For Enterprises</h3>
                <p className="text-zinc-400">Create a company-wide intelligence layer securely connecting code, databases, documents, and business processes.</p>
              </div>
            </div>
          </div>

          {/* Right: Terminal Examples */}
          <div className="bg-[#0a0a0a] rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden flex flex-col">
            <div className="bg-[#111] px-4 py-3 flex items-center gap-2 border-b border-zinc-800">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-xs text-zinc-500 font-mono ml-4">knowledge-query.sh</span>
            </div>
            <div className="p-6 font-mono text-sm leading-relaxed flex-grow">
              <div className="mb-6">
                <span className="text-emerald-400">user@genwork:~$</span> ask "How does customer registration work?"
                <br/><br/>
                <span className="text-zinc-500"># Retrieving architectural context...</span>
                <br/>
                <span className="text-blue-400">Frontend:</span> <span className="text-white">CustomerRegistrationScreen.tsx</span><br/>
                <span className="text-violet-400">Backend:</span> <span className="text-white">POST /api/customer/register</span><br/>
                <span className="text-cyan-400">Service:</span> <span className="text-white">CustomerService.java</span><br/>
                <span className="text-orange-400">Database:</span> <span className="text-white">sp_create_customer</span><br/>
                <span className="text-pink-400">Tables:</span> <span className="text-white">customer_master, user_profiles</span>
              </div>
              
              <div>
                <span className="text-emerald-400">user@genwork:~$</span> find api "returns shipment details"
                <br/><br/>
                <span className="text-zinc-500"># Exact Match Found:</span>
                <br/>
                <span className="text-white bg-white/10 px-2 py-1 rounded">GET /api/shipments/&#123;id&#125;</span>
                <br/><br/>
                <span className="text-zinc-400">Requires Authentication:</span> true<br/>
                <span className="text-zinc-400">Response Schema:</span> ShipmentResponseDTO
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Why GenWorkAI Comparison */}
      <section className="py-24 bg-black px-6 border-y border-white/5">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Why GenWorkAI?</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="border border-red-500/20 bg-red-500/5 p-8 rounded-3xl">
              <h3 className="text-2xl font-bold text-red-400 mb-6 flex items-center gap-2"><XCircle className="w-6 h-6"/> Traditional AI</h3>
              <ul className="space-y-4 text-zinc-400">
                <li>• Expensive per-token API Calls</li>
                <li>• Frequent Hallucinations</li>
                <li>• Limited Context Windows</li>
                <li>• Repeated Operating Costs</li>
                <li>• Difficult to wire into apps</li>
              </ul>
            </div>

            <div className="border border-emerald-500/30 bg-emerald-500/10 p-8 rounded-3xl shadow-[0_0_30px_rgba(16,185,129,0.1)]">
              <h3 className="text-2xl font-bold text-emerald-400 mb-6 flex items-center gap-2"><CheckCircle2 className="w-6 h-6"/> GenWorkAI</h3>
              <ul className="space-y-4 text-white font-medium">
                <li>• Knowledge & Graph Driven</li>
                <li>• Deterministic Structured Retrieval</li>
                <li>• MCP Server Ready Out-of-the-box</li>
                <li>• Exposes standard Developer APIs</li>
                <li>• Drastically Lower Operating Costs</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6 text-center">
        <h2 className="text-5xl md:text-6xl font-black text-white mb-6">Build Applications From Knowledge</h2>
        <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-12">
          Transform repositories, databases, and documents into APIs, MCP servers, and application-ready intelligence today.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/signup" className="bg-white text-black px-10 py-5 rounded-2xl text-xl font-bold hover:scale-105 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.3)]">
            Start Building Today
          </Link>
          <Link href="/contact" className="bg-white/10 border border-white/20 text-white px-10 py-5 rounded-2xl text-xl font-bold hover:scale-105 transition-transform backdrop-blur-md">
            Book a Demo
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black py-12 px-6 text-sm text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-violet-500" /> 
            <span className="font-bold text-zinc-300">GenWorkAI</span> &copy; {new Date().getFullYear()}
          </div>
          
          <div className="flex flex-wrap justify-center gap-6">
            <Link href="/support" className="hover:text-white transition-colors">Support & Ticketing</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Early Access</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/refund" className="hover:text-white transition-colors">Refund Policy</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
