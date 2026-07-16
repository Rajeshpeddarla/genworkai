"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, ArrowLeft, Send } from "lucide-react";
import { motion } from "framer-motion";

export default function ContactPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate network request
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setLoading(false);
    setSuccess(true);
    setEmail("");
    setMessage("");
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col selection:bg-cyan-500/30">
      
      {/* Intense Volumetric Corner Glows */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-50 mix-blend-screen">
        <div className="absolute -top-[20vh] -left-[20vw] w-[50vw] h-[50vh] bg-cyan-600/20 blur-[150px] rounded-full" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        
        <div className="w-full max-w-lg">
          <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-cyan-400 font-mono text-xs uppercase tracking-widest mb-12 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Return to Terminal
          </Link>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-white/10 bg-black/80 backdrop-blur-xl p-10 shadow-[0_0_50px_rgba(34,211,238,0.05)] relative overflow-hidden"
          >
            {/* Top scanning line effect */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />
            
            <div className="mb-10">
              <h1 className="font-pixel text-3xl text-white mb-4 uppercase text-center">Comm Link</h1>
              <p className="font-mono text-sm text-zinc-400 leading-relaxed text-center">
                Need custom models? High volume throughput? Reach out to our engineering team to deploy specialized BaseParse nodes.
              </p>
            </div>

            {success ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 p-6 border border-cyan-500/30 bg-cyan-500/10 text-center font-mono"
              >
                <div className="text-cyan-400 font-bold mb-2 uppercase tracking-widest">Message Transmitted</div>
                <div className="text-zinc-400 text-sm">Our node engineers will respond to your channel shortly.</div>
                <button 
                  onClick={() => setSuccess(false)}
                  className="mt-6 text-xs text-white border-b border-white/30 hover:border-white transition-colors pb-1"
                >
                  Send another transmission
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-6 font-mono text-sm">
                <div>
                  <label className="block text-cyan-500 mb-2 uppercase tracking-widest text-xs">Return Address (Email)</label>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-[#050505] border border-white/10 focus:border-cyan-500 outline-none transition-colors text-white placeholder-zinc-700"
                    placeholder="user@system.local"
                  />
                </div>

                <div>
                  <label className="block text-cyan-500 mb-2 uppercase tracking-widest text-xs">Payload (Message)</label>
                  <textarea 
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-4 py-3 bg-[#050505] border border-white/10 focus:border-cyan-500 outline-none transition-colors text-white placeholder-zinc-700 resize-none"
                    placeholder="Describe your data pipeline requirements..."
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-white hover:bg-cyan-400 text-black py-4 font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 uppercase tracking-widest"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Transmit <Send className="w-4 h-4 ml-2" /></>}
                </button>
              </form>
            )}

          </motion.div>
        </div>
      </div>
    </div>
  );
}
