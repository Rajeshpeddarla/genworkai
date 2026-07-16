"use client";

import { useMockData, TicketStatus } from "../../../MockProvider";
import { MessageSquare, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminTicketsPage() {
  const { tickets, updateTicketStatus } = useMockData();

  const handleStatusChange = (id: string, newStatus: TicketStatus) => {
    updateTicketStatus(id, newStatus);
  };

  return (
    <div className="min-h-screen bg-[#030303] text-white flex">
      {/* Sidebar */}
      <div className="w-64 border-r border-white/5 bg-black/50 p-6 flex flex-col">
        <Link href="/" className="flex items-center gap-3 mb-10">
          <img src="/logo.png" className="w-6 h-6 object-contain" alt="BaseParse" />
          <span className="font-bold">Admin Panel</span>
        </Link>
        <div className="flex flex-col gap-2">
          <Link href="/admin/billing" className="px-4 py-2 text-zinc-400 hover:bg-white/5 rounded-lg transition-colors">Billing & Plans</Link>
          <Link href="/admin/tickets" className="px-4 py-2 bg-violet-500/10 text-violet-400 font-bold rounded-lg">Support Tickets</Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-10">
        <h1 className="text-3xl font-black mb-8 flex items-center gap-3">
          <MessageSquare className="w-8 h-8 text-violet-400" />
          Manage Tickets
        </h1>

        <div className="space-y-4">
          <AnimatePresence>
            {tickets.map((ticket) => (
              <motion.div
                key={ticket.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#0a0a0a] border border-white/5 p-6 rounded-2xl flex flex-col xl:flex-row justify-between xl:items-center gap-6"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-mono text-zinc-500">{ticket.id}</span>
                    <span className="text-xs text-zinc-500">{new Date(ticket.createdAt).toLocaleString()}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">{ticket.subject}</h3>
                  <p className="text-zinc-400 text-sm">{ticket.description}</p>
                </div>
                
                <div className="flex items-center gap-3 bg-black/50 p-2 rounded-xl border border-white/5 shrink-0">
                  <button
                    onClick={() => handleStatusChange(ticket.id, "pending")}
                    className={`flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-lg transition-colors ${
                      ticket.status === "pending" ? "bg-yellow-500/20 text-yellow-500" : "text-zinc-500 hover:bg-white/5"
                    }`}
                  >
                    <Clock className="w-3 h-3" /> Pending
                  </button>
                  <button
                    onClick={() => handleStatusChange(ticket.id, "working")}
                    className={`flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-lg transition-colors ${
                      ticket.status === "working" ? "bg-cyan-500/20 text-cyan-400" : "text-zinc-500 hover:bg-white/5"
                    }`}
                  >
                    <AlertCircle className="w-3 h-3" /> Working
                  </button>
                  <button
                    onClick={() => handleStatusChange(ticket.id, "resolved")}
                    className={`flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-lg transition-colors ${
                      ticket.status === "resolved" ? "bg-emerald-500/20 text-emerald-500" : "text-zinc-500 hover:bg-white/5"
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" /> Resolved
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {tickets.length === 0 && (
            <div className="text-center py-20 text-zinc-500 bg-[#0a0a0a] border border-white/5 rounded-2xl">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No support tickets found in the system.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
