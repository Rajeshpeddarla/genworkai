"use client";

import { useState } from "react";
import { useMockData } from "../MockProvider";
import { MessageSquare, Plus, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function SupportPage() {
  const { tickets, addTicket } = useMockData();
  const [isCreating, setIsCreating] = useState(false);
  const [subject, setSubject] = useState("");
  const [desc, setDesc] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !desc.trim()) return;
    addTicket(subject, desc);
    setSubject("");
    setDesc("");
    setIsCreating(false);
  };

  return (
    <div className="min-h-screen bg-[#030303] text-white">
      {/* Navbar Minimal */}
      <nav className="border-b border-white/5 p-4 flex justify-between items-center bg-black/50 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-3">
          <img src="/logo.png" className="w-8 h-8 object-contain" alt="BaseParse" />
          <span className="font-bold text-xl">BaseParse</span>
        </Link>
        <Link href="/admin/tickets" className="text-sm font-medium text-cyan-400 hover:text-cyan-300">
          Go to Admin Portal
        </Link>
      </nav>

      <div className="max-w-4xl mx-auto pt-16 px-6">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-4xl font-black mb-2 flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-violet-400" />
              Support Center
            </h1>
            <p className="text-zinc-400">View and manage your support tickets.</p>
          </div>
          <button
            onClick={() => setIsCreating(!isCreating)}
            className="flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-full font-bold hover:bg-zinc-200 transition-colors"
          >
            {isCreating ? "Cancel" : <><Plus className="w-4 h-4" /> New Ticket</>}
          </button>
        </div>

        <AnimatePresence>
          {isCreating && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleSubmit}
              className="bg-[#0a0a0a] border border-white/10 p-6 rounded-2xl mb-8 overflow-hidden"
            >
              <h3 className="text-xl font-bold mb-4">Create New Ticket</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                    placeholder="Brief description of the issue"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Details</label>
                  <textarea
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors h-32 resize-none"
                    placeholder="Provide as much detail as possible..."
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-6 py-3 rounded-xl transition-colors"
                >
                  Submit Ticket
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="space-y-4 pb-20">
          <AnimatePresence>
            {tickets.map((ticket) => (
              <motion.div
                key={ticket.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#0a0a0a] border border-white/5 p-6 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-white/10 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-mono text-zinc-500">{ticket.id}</span>
                    {ticket.status === "pending" && <span className="flex items-center gap-1 text-xs font-bold text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-full"><Clock className="w-3 h-3" /> Pending</span>}
                    {ticket.status === "working" && <span className="flex items-center gap-1 text-xs font-bold text-cyan-400 bg-cyan-400/10 px-2 py-1 rounded-full"><AlertCircle className="w-3 h-3" /> In Progress</span>}
                    {ticket.status === "resolved" && <span className="flex items-center gap-1 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full"><CheckCircle2 className="w-3 h-3" /> Resolved</span>}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">{ticket.subject}</h3>
                  <p className="text-zinc-400 text-sm">{ticket.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs text-zinc-500">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {tickets.length === 0 && (
            <div className="text-center py-20 text-zinc-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No support tickets found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
