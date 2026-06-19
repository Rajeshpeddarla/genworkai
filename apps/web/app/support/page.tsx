"use client";

import React, { useState, useEffect } from "react";
import { LifeBuoy, Send, ArrowLeft, CheckCircle2, Clock, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function SupportPage() {
  const [formData, setFormData] = useState({
    type: "support",
    name: "",
    email: "",
    company: "",
    subject: "",
    message: "",
    priority: "medium",
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [tickets, setTickets] = useState<any[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Try to fetch user's tickets to determine if logged in and get history
    fetch("/api/tickets")
      .then((res) => {
        if (res.ok) {
          setIsAuthenticated(true);
          return res.json();
        }
        throw new Error("Not logged in");
      })
      .then((data) => setTickets(data))
      .catch(() => setIsAuthenticated(false));
  }, [status]); // re-fetch when a ticket is submitted

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit ticket");

      setStatus("success");
      setFormData({ ...formData, subject: "", message: "" });
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message);
      setStatus("error");
    }
  };

  const getStatusBadge = (ticketStatus: string) => {
    switch (ticketStatus) {
      case 'open': return <span className="px-2 py-1 bg-zinc-800 text-zinc-300 text-xs rounded-md border border-zinc-700 flex items-center gap-1"><Clock className="w-3 h-3"/> Open</span>;
      case 'in_progress': return <span className="px-2 py-1 bg-violet-500/20 text-violet-400 text-xs rounded-md border border-violet-500/30 flex items-center gap-1"><LifeBuoy className="w-3 h-3"/> In Progress</span>;
      case 'closed': return <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-md border border-emerald-500/30 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Closed</span>;
      default: return <span className="px-2 py-1 bg-zinc-800 text-zinc-300 text-xs rounded-md border border-zinc-700">{ticketStatus}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#020202] text-white flex flex-col font-sans">
      {!isAuthenticated && (
        <nav className="p-4 border-b border-white/5">
          <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </nav>
      )}

      <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2 flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <LifeBuoy className="w-5 h-5" />
            </div>
            Support Center
          </h1>
          <p className="text-zinc-400 text-sm">Submit a request or track your existing tickets.</p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Form Column */}
          <div className="lg:col-span-5 bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-xl">
            <h2 className="font-semibold text-lg mb-4 text-white">Create New Ticket</h2>
            
            {status === "success" ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white mb-2">Submitted!</h3>
                <p className="text-emerald-200/70 text-sm mb-4">We will respond shortly.</p>
                <button 
                  onClick={() => setStatus("idle")}
                  className="text-xs font-medium text-emerald-400 hover:text-emerald-300 underline"
                >
                  Submit another ticket
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {status === "error" && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-2 rounded-lg text-sm">
                    {errorMessage}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Name</label>
                    <input
                      required
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Email</label>
                    <input
                      required
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Company</label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="support">Support</option>
                      <option value="bug">Bug Report</option>
                      <option value="feature_request">Feature Request</option>
                      <option value="sales">Sales</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Subject</label>
                  <input
                    required
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    placeholder="Short description..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Message</label>
                  <textarea
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 resize-none"
                    placeholder="Provide details here..."
                  />
                </div>

                <button
                  disabled={status === "submitting"}
                  type="submit"
                  className="w-full bg-white text-black py-2.5 rounded-lg font-bold text-sm hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {status === "submitting" ? "Sending..." : (
                    <>Submit <Send className="w-4 h-4" /></>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Right Column: Dynamic Content */}
          {isAuthenticated ? (
            <div className="lg:col-span-7">
              <h2 className="font-semibold text-lg mb-4 text-white">Your Tickets</h2>
              {tickets.length === 0 ? (
                <div className="border border-white/5 border-dashed rounded-2xl p-10 text-center flex flex-col items-center justify-center text-zinc-500">
                  <LifeBuoy className="w-8 h-8 mb-3 opacity-20" />
                  <p className="text-sm">You haven't submitted any tickets yet.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {tickets.map((ticket) => (
                    <div key={ticket.id} className="bg-white/5 border border-white/10 p-4 rounded-xl hover:bg-white/10 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-medium text-white text-sm">{ticket.subject}</div>
                        {getStatusBadge(ticket.status)}
                      </div>
                      <p className="text-xs text-zinc-400 line-clamp-2 mb-3">{ticket.message}</p>
                      <div className="flex items-center justify-between text-[11px] text-zinc-500">
                        <span className="uppercase tracking-wider">{ticket.type.replace('_', ' ')}</span>
                        <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="hidden lg:flex lg:col-span-7 bg-zinc-950/50 border border-white/5 p-10 rounded-2xl flex-col justify-center relative overflow-hidden">
              {/* Subtle background glow */}
              <div className="absolute -top-[20%] -right-[20%] w-[60%] h-[60%] rounded-full bg-emerald-600/10 blur-[100px] pointer-events-none" />
              
              <div className="relative z-10 space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Enterprise Grade Support</h2>
                  <p className="text-zinc-400">Guaranteed SLAs and dedicated engineering resources for our enterprise partners.</p>
                </div>
                
                <div className="space-y-5">
                  <div className="flex gap-4">
                    <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg h-fit">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white">24-Hour SLA</h3>
                      <p className="text-sm text-zinc-400 mt-1">All tickets receive an initial response and action plan within 24 hours.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg h-fit">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white">Expert Engineering Team</h3>
                      <p className="text-sm text-zinc-400 mt-1">Your tickets are routed directly to the engineers building the GenWorkAI core.</p>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 flex items-center justify-between text-sm text-zinc-500">
                  <span>Sign in to track ticket status</span>
                  <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">Sign in &rarr;</Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
