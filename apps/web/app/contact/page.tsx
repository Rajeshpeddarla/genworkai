"use client";

import React, { useState } from "react";
import { BrainCircuit, Send, ArrowLeft, CheckCircle2, Database, Network, Zap, Shield } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    useCase: "",
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    try {
      const res = await fetch("/api/early-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit request");

      setStatus("success");
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message);
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-[#020202] text-white flex flex-col md:flex-row font-sans">
      
      {/* Left Column: Context & Visuals */}
      <div className="hidden md:flex md:w-1/2 lg:w-5/12 bg-card border-r border-white/10 p-12 flex-col justify-between relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[20%] w-[70%] h-[70%] rounded-full bg-fuchsia-600/10 blur-[120px]" />
          <div className="absolute bottom-[10%] -right-[20%] w-[60%] h-[60%] rounded-full bg-violet-600/10 blur-[100px]" />
        </div>

        <div className="relative z-10">
          <div className="mb-16">
            <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </Link>
          </div>
          
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-fuchsia-500/20 text-fuchsia-400 flex items-center justify-center">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight">GenWork<span className="text-violet-500">AI</span></span>
          </div>

          <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
            Turn Knowledge into <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-violet-400">Applications</span>.
          </h1>
          <p className="text-lg text-zinc-400 mb-12 max-w-md leading-relaxed">
            Join the early access program to transform your company's databases, documentation, and repositories into production-ready APIs and MCP servers in minutes.
          </p>

          <div className="space-y-6">
            <div className="flex gap-4 items-start">
              <div className="mt-1 p-2 bg-white/5 rounded-lg border border-white/10 text-emerald-400"><Database className="w-5 h-5"/></div>
              <div>
                <h3 className="font-semibold text-white">Database Intelligence</h3>
                <p className="text-sm text-zinc-400 mt-1">Connect Postgres, MySQL, and MongoDB instantly.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="mt-1 p-2 bg-white/5 rounded-lg border border-white/10 text-blue-400"><Network className="w-5 h-5"/></div>
              <div>
                <h3 className="font-semibold text-white">One-Click MCP Servers</h3>
                <p className="text-sm text-zinc-400 mt-1">Expose your entire knowledge base to Claude and Cursor securely.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="mt-1 p-2 bg-white/5 rounded-lg border border-white/10 text-orange-400"><Zap className="w-5 h-5"/></div>
              <div>
                <h3 className="font-semibold text-white">Automated Workflows</h3>
                <p className="text-sm text-zinc-400 mt-1">Trigger events and webhooks based on real-time data changes.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-12 pt-12 border-t border-white/10">
          <div className="flex items-center gap-3 text-sm text-zinc-500">
            <Shield className="w-4 h-4" />
            Enterprise-grade security and SOC2 compliance.
          </div>
        </div>
      </div>

      {/* Right Column: Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative">
        {/* Mobile back button */}
        <Link href="/" className="md:hidden absolute top-6 left-6 inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg"
        >
          <div className="md:hidden mb-10">
             <h1 className="text-3xl font-bold mb-3">Request Early Access</h1>
             <p className="text-zinc-400">Join the waitlist to turn your company's knowledge into APIs.</p>
          </div>

          {status === "success" ? (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-10 text-center">
              <CheckCircle2 className="w-20 h-20 text-emerald-400 mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-white mb-3">Request Received!</h2>
              <p className="text-emerald-200 text-lg">
                Thank you for your interest. Our engineering team will review your use case and reach out shortly with next steps.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 p-8 sm:p-10 rounded-3xl backdrop-blur-xl shadow-2xl">
              <h2 className="text-2xl font-semibold mb-6 text-white hidden md:block">Get Started</h2>
              
              {status === "error" && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">
                  {errorMessage}
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">Full Name</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">Work Email</label>
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                    placeholder="john@company.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">Company Name</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                    placeholder="Acme Corp"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">Primary Use Case</label>
                  <textarea
                    required
                    rows={4}
                    value={formData.useCase}
                    onChange={(e) => setFormData({ ...formData, useCase: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500 resize-none"
                    placeholder="Tell us what you want to build (e.g. Turn my Postgres DB into an MCP server for Cursor...)"
                  />
                </div>

                <button
                  disabled={status === "submitting"}
                  type="submit"
                  className="w-full bg-white text-black mt-2 py-4 rounded-xl font-bold text-lg hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {status === "submitting" ? "Submitting..." : (
                    <>Submit Request <Send className="w-5 h-5" /></>
                  )}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}
