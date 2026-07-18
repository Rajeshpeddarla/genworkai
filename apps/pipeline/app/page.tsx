"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from "framer-motion";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import TestZoneClient from "./components/TestZoneClient";
import { useRef } from "react";

export default function LandingPage() {
  const [showTestZone, setShowTestZone] = useState(false);
  const [pricingPlans, setPricingPlans] = useState<any[]>([]);
  const testZoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/pricing')
      .then(res => res.json())
      .then(data => {
        if (data.plans) setPricingPlans(data.plans);
      })
      .catch(console.error);
  }, []);

  const handleEnterTestZone = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowTestZone(true);
    setTimeout(() => {
      testZoneRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };
  const { scrollYProgress } = useScroll();
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  
  // Smooth out the scroll progress for drawing lines
  const smoothScroll = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  const lineDraw = useTransform(smoothScroll, [0, 1], [0, 1]);

  const [activeSection, setActiveSection] = useState("start");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.4 } // Trigger when 40% of the section is visible
    );

    document.querySelectorAll("section[id]").forEach((section) => {
      observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  const NavItem = ({ id, label }: { id: string, label: string }) => {
    const isActive = activeSection === id;
    return (
      <div className="flex flex-col items-center gap-2">
        <a 
          href={`#${id}`}
          className={`border rounded-full px-4 py-1 transition-all duration-500 cursor-pointer ${
            isActive ? "border-cyan-400 text-cyan-400 bg-cyan-950/30" : "border-white/10 text-zinc-600 hover:text-white hover:border-white/30"
          }`}
        >
          {label}
        </a>
        {isActive && <motion.div layoutId="dot" className="w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_10px_#22d3ee]" />}
      </div>
    );
  };
  
  return (
    <div className="bg-black text-white font-sans selection:bg-cyan-500/30 overflow-x-hidden min-h-screen">
      
      {/* Intense Volumetric Corner Glows */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-80 mix-blend-screen">
        <div className="absolute -top-[20vh] -left-[20vw] w-[70vw] h-[70vh] bg-cyan-600/20 blur-[150px] rounded-full" />
        <div className="absolute -bottom-[20vh] -right-[20vw] w-[70vw] h-[70vh] bg-violet-600/20 blur-[150px] rounded-full" />
      </div>

      {/* Ultra Minimalist Navbar */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-black/50 backdrop-blur-md">
        <div className="flex items-center justify-between p-4 md:px-8 max-w-[1400px] mx-auto">
          <Link href="/" className="flex items-center gap-3 group">
            <img 
              src="/logo.png" 
              alt="BaseParse Logo" 
              className="w-10 h-10 object-contain group-hover:scale-110 transition-transform" 
            />
            <span className="text-xl font-bold tracking-widest uppercase">BaseParse</span>
          </Link>
          <div className="hidden md:flex items-center gap-10 text-xs font-mono text-zinc-400">
            <Link href="#02" className="hover:text-white transition-colors uppercase tracking-widest">Platform</Link>
            <Link href="#03" className="hover:text-cyan-400 transition-colors uppercase tracking-widest">Architecture</Link>
            <Link href="/pricing" className="hover:text-white transition-colors uppercase tracking-widest">Pricing</Link>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-xs font-mono text-zinc-400 hover:text-white transition-colors uppercase tracking-widest hidden sm:block">Log in</Link>
            <Link href="/contact" className="group flex items-center gap-2 border border-white/20 text-white px-5 py-2 hover:border-cyan-400 transition-colors text-xs font-mono uppercase tracking-widest cursor-pointer">
              Let's Connect <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Right Fixed Progress Tracker */}
      <div className="fixed right-8 top-1/2 -translate-y-1/2 z-40 hidden xl:flex flex-col items-center gap-6 text-xs font-mono">
        <NavItem id="start" label="start" />
        <div className="w-[1px] h-12 bg-white/10" />
        <NavItem id="02" label="02" />
        <div className="w-[1px] h-12 bg-white/10" />
        <NavItem id="03" label="03" />
        <div className="w-[1px] h-12 bg-white/10" />
        <NavItem id="04" label="04" />
        <div className="w-[1px] h-12 bg-white/10" />
        <NavItem id="05" label="05" />
      </div>

      <main className="relative z-10 pt-32">
        
        {/* Massive Scroll-Linked Background Traces */}
        <div className="absolute inset-0 pointer-events-none opacity-50 overflow-hidden h-full">
          <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 3000">
            {/* The main data stream line that follows the scroll completely down the page */}
            <motion.path 
              d="M 200,200 L 200,600 L 100,700 L 100,1200 L 500,1600 L 500,2200 L 800,2500" 
              stroke="url(#cyan-grad)" 
              strokeWidth="2" 
              fill="none" 
              style={{ pathLength: lineDraw }} 
            />
            {/* Secondary violet stream */}
            <motion.path 
              d="M 800,400 L 800,800 L 900,900 L 900,1400 L 600,1700 L 600,2400" 
              stroke="url(#violet-grad)" 
              strokeWidth="2" 
              fill="none" 
              style={{ pathLength: lineDraw }} 
            />
            <defs>
              <linearGradient id="cyan-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#00f0ff" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="violet-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#7000ff" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#7000ff" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Hero Section */}
        <section id="start" className="min-h-[85vh] flex items-center max-w-[1400px] mx-auto px-6 relative">

          <div className="grid lg:grid-cols-2 gap-12 items-center w-full relative z-10">
            
            {/* Left Content (Typography) */}
            <motion.div 
              style={{ y: y2 }}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="order-2 lg:order-1"
            >
              <div className="font-mono text-cyan-400 text-sm tracking-[0.3em] uppercase mb-6 flex items-center gap-3">
                <div className="w-8 h-[1px] bg-cyan-400" />
                We Are BaseParse
              </div>
              
              <h1 className="font-pixel text-[60px] md:text-[90px] leading-[0.9] text-white mb-8 tracking-tighter">
                EMPOWERING <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400">
                  AUTONOMOUS <br/>
                  PIPELINES
                </span>
                <span className="text-violet-500">*</span>
              </h1>
              
              <p className="text-zinc-400 text-lg md:text-xl font-mono leading-relaxed max-w-xl mb-12">
                BaseParse is a proprietary ingestion engine providing autonomous document parsing, diagram extraction, and OCR across millions of unstructured files.
              </p>
              
              <div className="flex flex-wrap gap-4 font-mono text-sm uppercase tracking-widest font-bold">
                <button onClick={handleEnterTestZone} className="bg-cyan-500 text-black px-8 py-4 hover:bg-cyan-400 transition-colors cursor-pointer">
                  Deploy Node
                </button>
                <Link href="/pricing" className="bg-violet-600 text-white px-8 py-4 hover:bg-violet-500 transition-colors">
                  View Pricing
                </Link>
              </div>
            </motion.div>

            {/* Right Content (3D Graphic) */}
            <motion.div 
              style={{ y: y1 }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="order-1 lg:order-2 h-[400px] lg:h-[600px] w-full flex items-center justify-center perspective-[2000px]"
            >
              {/* CSS 3D Cube representing the Hardware/Extraction Node */}
              <motion.div
                animate={{ rotateY: 360, rotateX: [10, 20, 10] }}
                transition={{ rotateY: { duration: 20, repeat: Infinity, ease: "linear" }, rotateX: { duration: 10, repeat: Infinity, ease: "easeInOut" } }}
                className="relative w-64 h-64 transform-style-3d cursor-pointer group"
              >
                {/* Core Glow */}
                <div className="absolute inset-0 bg-cyan-500/20 blur-[100px] group-hover:bg-violet-500/40 transition-colors duration-1000" />
                
                {/* Faces */}
                {/* Front */}
                <div className="absolute inset-0 border border-cyan-500/50 bg-black/80 backdrop-blur-md flex items-center justify-center transform translate-z-32">
                  <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/20 to-transparent" />
                  <img src="/logo.png" className="w-40 h-40 opacity-100 relative z-10 filter drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]" alt="Node" />
                </div>
                {/* Back */}
                <div className="absolute inset-0 border border-cyan-500/20 bg-black/90 rotate-y-180" />
                {/* Right */}
                <div className="absolute inset-0 border border-cyan-500/30 bg-black/90 rotate-y-90 flex items-center justify-center">
                  <div className="w-full h-1 bg-cyan-500/50 shadow-[0_0_10px_#00f0ff]" />
                </div>
                {/* Left */}
                <div className="absolute inset-0 border border-cyan-500/30 bg-black/90 -rotate-y-90 flex items-center justify-center">
                  <div className="w-full h-1 bg-cyan-500/50 shadow-[0_0_10px_#00f0ff]" />
                </div>
                {/* Top */}
                <div className="absolute inset-0 border border-cyan-500/40 bg-black/80 rotate-x-90 grid grid-cols-4 grid-rows-4 gap-1 p-2">
                  {[...Array(16)].map((_, i) => (
                    <motion.div 
                      key={i} 
                      animate={{ opacity: [0.2, 1, 0.2] }}
                      transition={{ duration: 1 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
                      className="bg-cyan-500/40 rounded-sm" 
                    />
                  ))}
                </div>
                {/* Bottom */}
                <div className="absolute inset-0 border border-cyan-500/20 bg-black/90 -rotate-x-90" />
              </motion.div>
            </motion.div>

          </div>
        </section>

        {/* Scroll To Learn More Indicator */}
        <div className="max-w-[1400px] mx-auto px-6 pb-24 flex justify-center lg:justify-start">
          <motion.div 
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="font-mono text-xs text-zinc-500 tracking-[0.2em] uppercase"
          >
            Scroll to learn more...
          </motion.div>
        </div>
        
        {/* Section 02 - Platform Features (DENSE UI) */}
        <section id="02" className="min-h-screen flex flex-col justify-center max-w-[1400px] mx-auto px-6 border-t border-white/5 relative py-32">
          <div className="absolute left-0 top-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,rgba(34,211,238,0.05),transparent_50%)] pointer-events-none" />
          
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-[1px] bg-cyan-500" />
            <span className="font-mono text-cyan-500 tracking-[0.3em] uppercase text-sm">Phase 02 // Capability</span>
          </div>

          <div className="grid lg:grid-cols-2 gap-16">
            <div>
              <h2 className="font-pixel text-[50px] md:text-[80px] leading-[0.9] text-white mb-8">
                DOCUMENT <br/> INTELLIGENCE.
              </h2>
              <p className="text-zinc-400 font-mono text-lg mb-12 leading-relaxed max-w-xl">
                Our autonomous nodes do more than basic OCR. They extract rich structural JSON, mathematical formulas, and generate AI-ready semantic chunks and embeddings out-of-the-box using advanced Vision-Language Models.
              </p>
              
              <div className="grid grid-cols-2 gap-4 font-mono text-sm">
                <div className="p-8 border border-white/10 bg-black/50 backdrop-blur-sm group hover:border-cyan-500/50 transition-all cursor-crosshair">
                  <div className="text-cyan-400 font-bold mb-4 text-2xl group-hover:scale-110 transition-transform origin-left">01.</div>
                  <div className="text-white mb-2 uppercase tracking-widest font-bold">Parse</div>
                  <div className="text-zinc-500">Extracts rich JSON, CSV tables, and LaTeX formulas.</div>
                </div>
                <div className="p-8 border border-white/10 bg-black/50 backdrop-blur-sm group hover:border-violet-500/50 transition-all cursor-crosshair">
                  <div className="text-violet-400 font-bold mb-4 text-2xl group-hover:scale-110 transition-transform origin-left">02.</div>
                  <div className="text-white mb-2 uppercase tracking-widest font-bold">Chunk</div>
                  <div className="text-zinc-500">Intelligently splits documents into semantic chunks.</div>
                </div>
                <div className="p-8 border border-white/10 bg-black/50 backdrop-blur-sm group hover:border-emerald-500/50 transition-all cursor-crosshair">
                  <div className="text-emerald-400 font-bold mb-4 text-2xl group-hover:scale-110 transition-transform origin-left">03.</div>
                  <div className="text-white mb-2 uppercase tracking-widest font-bold">Embed</div>
                  <div className="text-zinc-500">Generates precise vector embeddings via Gemini.</div>
                </div>
                <div className="p-8 border border-white/10 bg-black/50 backdrop-blur-sm group hover:border-amber-500/50 transition-all cursor-crosshair">
                  <div className="text-amber-500 font-bold mb-4 text-2xl group-hover:scale-110 transition-transform origin-left">04.</div>
                  <div className="text-white mb-2 uppercase tracking-widest font-bold">Search (RAG)</div>
                  <div className="text-zinc-500">Query your documents instantly with our built-in Search API.</div>
                </div>
              </div>
            </div>

            {/* Right side graphic for Section 2 (Animated Pipeline) */}
            <div className="relative h-full min-h-[400px] border border-white/10 bg-[#050505] overflow-hidden flex items-center justify-center p-8 group">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
              
              <div className="relative w-full h-full flex flex-col justify-between max-w-sm mx-auto z-10 font-mono text-xs">
                
                {/* Step 1: Input PDF */}
                <motion.div 
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: [0, 5, 0], opacity: 1 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="bg-black border border-white/20 p-4 rounded-xl flex items-center gap-4 relative shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                >
                  <div className="w-10 h-12 bg-zinc-800 rounded flex items-center justify-center border border-white/10 shrink-0">
                    <span className="text-white font-bold text-lg">PDF</span>
                  </div>
                  <div>
                    <div className="text-white font-bold mb-1">Architecture_Diagram.pdf</div>
                    <div className="text-zinc-500">2.4 MB // Unstructured</div>
                  </div>
                  {/* Connecting Line Down */}
                  <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[1px] h-10 bg-gradient-to-b from-white/20 to-cyan-500/50" />
                  <motion.div 
                    animate={{ y: [0, 40] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_10px_#22d3ee]"
                  />
                </motion.div>

                {/* Step 2: VLM Processing Node */}
                <div className="relative bg-black border border-cyan-500/50 p-6 rounded-xl text-center shadow-[0_0_30px_rgba(34,211,238,0.1)] my-10 group-hover:border-cyan-400 transition-colors">
                  {/* Laser Scanner Animation */}
                  <div className="absolute inset-x-0 top-0 h-10 overflow-hidden rounded-t-xl pointer-events-none">
                    <motion.div 
                      animate={{ y: [-10, 40, -10] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-full h-[2px] bg-cyan-400 shadow-[0_0_15px_#22d3ee]"
                    />
                    <motion.div 
                      animate={{ y: [-10, 40, -10] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-full h-8 bg-gradient-to-b from-cyan-500/0 to-cyan-500/20"
                    />
                  </div>
                  
                  <div className="text-cyan-400 font-pixel text-2xl mb-2 relative z-10">VLM ENGINE</div>
                  <div className="text-cyan-500/70 uppercase tracking-widest relative z-10">Visual Reasoning Active</div>

                  {/* Connecting Lines Down (Split) */}
                  <div className="absolute -bottom-12 left-1/4 w-[1px] h-12 bg-gradient-to-b from-cyan-500/50 to-violet-500/50" />
                  <div className="absolute -bottom-12 right-1/4 w-[1px] h-12 bg-gradient-to-b from-cyan-500/50 to-emerald-500/50" />
                  
                  <motion.div 
                    animate={{ y: [0, 48] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear", delay: 0.2 }}
                    className="absolute -bottom-12 left-1/4 -translate-x-1/2 w-1.5 h-1.5 bg-violet-400 rounded-full shadow-[0_0_10px_#8b5cf6]"
                  />
                  <motion.div 
                    animate={{ y: [0, 48] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear", delay: 0.4 }}
                    className="absolute -bottom-12 right-1/4 translate-x-1/2 w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_10px_#10b981]"
                  />
                </div>

                {/* Step 3: Extracted Output */}
                <div className="flex gap-4">
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: [0, -5, 0], opacity: 1 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="flex-1 bg-black border border-violet-500/30 p-4 rounded-xl text-center"
                  >
                    <div className="text-violet-400 font-bold mb-2">Base64 Asset</div>
                    <div className="w-full h-12 border border-violet-500/20 rounded flex items-center justify-center bg-violet-950/20">
                      <div className="w-6 h-6 border-2 border-violet-500 rounded-full border-dashed animate-spin" />
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: [0, -5, 0], opacity: 1 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                    className="flex-1 bg-black border border-emerald-500/30 p-4 rounded-xl text-center"
                  >
                    <div className="text-emerald-400 font-bold mb-2">JSON Mapping</div>
                    <div className="text-left text-[10px] text-emerald-500/70 leading-tight bg-emerald-950/20 p-2 rounded h-12 overflow-hidden border border-emerald-500/20">
                      {`{\n "id": "fig_1",\n "type": "arch"\n}`}
                    </div>
                  </motion.div>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* Section 03 - Architecture (DENSE UI) */}
        <section id="03" className="min-h-screen flex flex-col justify-center max-w-[1400px] mx-auto px-6 border-t border-white/5 relative py-32">
          <div className="absolute right-0 top-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_right,rgba(112,0,255,0.05),transparent_50%)] pointer-events-none" />
          
          <div className="flex items-center gap-4 mb-8 justify-end">
            <span className="font-mono text-violet-500 tracking-[0.3em] uppercase text-sm">Phase 03 // Infrastructure</span>
            <div className="w-12 h-[1px] bg-violet-500" />
          </div>

          <div className="max-w-4xl ml-auto text-right">
            <h2 className="font-pixel text-[50px] md:text-[80px] leading-[0.9] text-white mb-8">
              SECURE BY <br/> DESIGN.
            </h2>
            <p className="text-zinc-400 font-mono text-lg mb-12 leading-relaxed ml-auto max-w-xl">
              Every BaseParse node runs in a highly secure, ephemeral container. Data is processed in-memory and immediately destroyed after the JSON payload is delivered to your servers. We retain absolutely zero data.
            </p>
            
            <div className="grid sm:grid-cols-3 gap-4 font-mono text-sm text-left">
              <div className="border border-white/10 p-6 bg-black">
                <div className="text-white font-bold mb-2 uppercase">Ephemeral Containers</div>
                <div className="text-zinc-500 text-xs leading-relaxed">Instantiated on demand. Destroyed post-extraction.</div>
              </div>
              <div className="border border-white/10 p-6 bg-black">
                <div className="text-white font-bold mb-2 uppercase">Zero Retention</div>
                <div className="text-zinc-500 text-xs leading-relaxed">No databases. No logs containing user documents.</div>
              </div>
              <div className="border border-white/10 p-6 bg-black">
                <div className="text-white font-bold mb-2 uppercase">SOC2 Compliant</div>
                <div className="text-zinc-500 text-xs leading-relaxed">Enterprise-grade security controls at every layer.</div>
              </div>
            </div>

            <div className="mt-8 border border-white/20 p-6 font-mono text-sm bg-[#050505] text-left max-w-2xl ml-auto">
              <div className="text-zinc-500 mb-2">// Server Terminal Output</div>
              <div className="text-zinc-300 mb-1">$ baseparse --status</div>
              <div className="text-emerald-400 mb-4">[OK] All systems secure. Volatile memory cleared.</div>
              <div className="w-full h-1 bg-white/5 overflow-hidden">
                <motion.div 
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-1/2 h-full bg-emerald-500"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Section 04 - CTA (NEW DENSE SECTION) */}
        <section id="04" ref={testZoneRef} className="min-h-screen flex flex-col items-center justify-center max-w-[1400px] mx-auto px-6 border-t border-white/5 relative py-32 w-full">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
             {/* Huge background typography for texture */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-pixel text-[200px] md:text-[300px] text-white/5 whitespace-nowrap">
               DEPLOY
             </div>
          </div>
          
          <AnimatePresence mode="wait">
            {!showTestZone ? (
              <motion.div 
                key="cta"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative z-10 max-w-3xl border border-white/10 bg-black/80 backdrop-blur-xl p-16 shadow-[0_0_100px_rgba(0,240,255,0.05)] text-center"
              >
                <h2 className="font-pixel text-[40px] md:text-[60px] text-white mb-6 uppercase">
                  Ready to Extract?
                </h2>
                <p className="text-zinc-400 font-mono text-lg mb-10 leading-relaxed">
                  Experience the power of autonomous extraction. Deploy a test node right now in the browser and watch BaseParse rip through your most complex PDF diagrams.
                </p>
                <button onClick={handleEnterTestZone} className="inline-block bg-white text-black font-pixel text-xl px-12 py-6 hover:bg-cyan-400 hover:scale-105 transition-all shadow-[8px_8px_0px_#00f0ff] cursor-pointer">
                  ENTER TEST ZONE_
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="test-zone"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 w-full"
              >
                <div className="flex items-center gap-4 mb-12">
                  <div className="w-12 h-[1px] bg-cyan-500" />
                  <span className="font-mono text-cyan-500 tracking-[0.3em] uppercase text-sm">Zone // Sandbox Environment</span>
                </div>
                <h2 className="font-pixel text-[40px] md:text-[60px] text-white mb-12 uppercase text-left w-full">
                  TEST DEPLOYMENT.
                </h2>
                <TestZoneClient />
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Section 05 - Pricing */}
        <section id="05" className="min-h-screen flex flex-col justify-center max-w-[1400px] mx-auto px-6 border-t border-white/5 relative py-32">
          <div className="absolute left-0 top-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,rgba(34,211,238,0.05),transparent_50%)] pointer-events-none" />
          
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-[1px] bg-cyan-500" />
            <span className="font-mono text-cyan-500 tracking-[0.3em] uppercase text-sm">Phase 05 // Acquisition</span>
          </div>

          <div className="mb-16">
            <h2 className="font-pixel text-[50px] md:text-[80px] leading-[0.9] text-white mb-6">
              USAGE PRICING.
            </h2>
            <p className="text-zinc-400 font-mono text-lg leading-relaxed max-w-xl">
              Pay strictly for compute time and successful extractions. No complex tiers, no arbitrary rate limits. High volume nodes deployed on demand.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {pricingPlans.map((plan, i) => {
              const colors = [
                { border: 'border-white/10 hover:border-cyan-500/50', text: 'text-cyan-400', button: 'hover:bg-cyan-400', bg: 'bg-cyan-400' },
                { border: 'border-white/10 hover:border-violet-500/50', text: 'text-violet-400', button: 'hover:bg-violet-500', bg: 'bg-violet-400' },
                { border: 'border-white/10 hover:border-emerald-500/50', text: 'text-emerald-400', button: 'hover:bg-emerald-500', bg: 'bg-emerald-400' },
                { border: 'border-white/10 hover:border-amber-500/50', text: 'text-amber-500', button: 'hover:bg-amber-500', bg: 'bg-amber-500' }
              ];
              const c = colors[i % colors.length];
              
              return (
              <div key={plan.id} className={`border ${c.border} bg-black/50 backdrop-blur-sm p-10 flex flex-col transition-colors`}>
                <div className={`${c.text} font-bold mb-2 uppercase tracking-widest text-sm`}>{plan.name} Node</div>
                <div className="text-white font-pixel text-4xl mb-6">${(plan.priceCents / 100)}<span className="text-lg text-zinc-500 font-mono">/mo</span></div>
                <p className="text-zinc-400 font-mono text-sm mb-10 h-16">
                  {plan.name === 'Free' ? 'Perfect for testing pipelines locally and evaluating accuracy.' : 
                   plan.name === 'Starter' ? 'For small scale extraction tasks and moderate volume.' :
                   plan.name === 'Pro' ? 'High throughput autonomous extraction for heavy pipelines.' :
                   'Dedicated compute for enterprise volume.'}
                </p>
                <ul className="space-y-4 mb-10 flex-1 font-mono text-sm text-zinc-300">
                  <li className="flex items-center gap-3"><div className={`w-1 h-1 ${c.bg} rounded-full`} /> {plan.pageExtractionLimit.toLocaleString()} Pages/mo</li>
                  <li className="flex items-center gap-3"><div className={`w-1 h-1 ${c.bg} rounded-full`} /> {plan.name === 'Enterprise' ? 'Dedicated' : 'Shared'} Infrastructure</li>
                  <li className="flex items-center gap-3"><div className={`w-1 h-1 ${c.bg} rounded-full`} /> {plan.name === 'Enterprise' || plan.name === 'Pro' ? 'High' : 'Standard'} Priority Queue</li>
                  <li className="flex items-center gap-3"><div className={`w-1 h-1 ${c.bg} rounded-full`} /> {plan.name === 'Enterprise' ? 'Dedicated' : 'Community'} Support</li>
                </ul>
                <Link href="/signup" className={`w-full text-center border border-white/20 text-white ${c.button} hover:text-black py-4 font-mono text-sm uppercase tracking-widest transition-colors font-bold`}>
                  Deploy {plan.name} Node
                </Link>
              </div>
            )})}
            {pricingPlans.length === 0 && (
               <div className="col-span-full py-12 text-center text-zinc-500 font-mono">Loading pricing nodes...</div>
            )}
          </div>
        </section>

      </main>

      <footer className="border-t border-white/10 bg-black py-12 relative z-10">
        <div className="max-w-[1400px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 font-mono text-xs text-zinc-500">
          <div>&copy; {new Date().getFullYear()} BaseParse. All rights reserved.</div>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-cyan-400 transition-colors uppercase">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-violet-400 transition-colors uppercase">Privacy Notice</Link>
            <Link href="/refund" className="hover:text-emerald-400 transition-colors uppercase">Refund Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
