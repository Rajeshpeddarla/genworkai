"use client";

import React, { useState } from "react";
import { LifeBuoy, Send, ArrowLeft, CheckCircle2, Clock, Plus, MessageSquare, Paperclip } from "lucide-react";
import Link from "next/link";
import { createTicket, replyToUserTicket } from "./actions";

export default function SupportClient({ initialTickets, currentUserId }: { initialTickets: any[], currentUserId: string }) {
  const [activeTicket, setActiveTicket] = useState<string | "new" | null>(initialTickets[0]?.id || null);
  const [reply, setReply] = useState("");
  
  // New ticket form state
  const [newTicket, setNewTicket] = useState({ subject: "", type: "support", priority: "medium", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentTicket = initialTickets.find(t => t.id === activeTicket);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await createTicket(currentUserId, newTicket);
    setIsSubmitting(false);
    setActiveTicket(null); // Actually, we'd ideally select the newly created one, but reloading will just show it.
    setNewTicket({ subject: "", type: "support", priority: "medium", message: "" });
  };

  const handleReply = async () => {
    if (!reply || !currentTicket) return;
    const content = reply;
    setReply("");
    await replyToUserTicket(currentTicket.id, currentUserId, content);
  };

  return (
    <div className="h-screen bg-[#020202] text-white flex flex-col font-sans overflow-hidden">
      <nav className="px-6 py-4 border-b border-white/5 flex justify-between items-center shrink-0">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
          <LifeBuoy className="w-4 h-4" /> Support Center
        </div>
      </nav>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane - Ticket List */}
        <div className="w-1/3 max-w-sm border-r border-white/5 flex flex-col bg-zinc-950/30 shrink-0">
          <div className="p-4 border-b border-white/5 shrink-0">
            <button 
              onClick={() => setActiveTicket("new")}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Create New Ticket
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {initialTickets.length === 0 ? (
              <div className="p-8 text-center text-zinc-500">
                <LifeBuoy className="w-8 h-8 mx-auto mb-3 opacity-20" />
                <p className="text-sm">No tickets yet.</p>
              </div>
            ) : (
              initialTickets.map(ticket => (
                <div 
                  key={ticket.id} 
                  onClick={() => setActiveTicket(ticket.id)}
                  className={`p-4 border-b border-white/5 cursor-pointer transition-colors ${
                    activeTicket === ticket.id 
                      ? 'bg-white/5 border-l-4 border-l-emerald-500' 
                      : 'hover:bg-white/5 border-l-4 border-l-transparent'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-white text-sm truncate pr-2">{ticket.subject}</span>
                    <span className="text-xs text-zinc-500 shrink-0">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${
                      ticket.priority === 'high' || ticket.priority === 'urgent' ? 'text-rose-400' : 
                      ticket.priority === 'medium' ? 'text-orange-400' : 'text-blue-400'
                    }`}>{ticket.priority}</span>
                    <span className={`flex items-center gap-1 text-[11px] font-medium ${
                      ticket.status === 'open' ? 'text-emerald-400' : 
                      ticket.status === 'pending' ? 'text-orange-400' : 'text-zinc-500'
                    }`}>
                      {ticket.status === 'resolved' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {ticket.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Pane - Chat / Create View */}
        <div className="flex-1 flex flex-col bg-[#020202] relative">
          {activeTicket === "new" ? (
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="max-w-2xl mx-auto">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-white mb-2">Create New Ticket</h2>
                  <p className="text-zinc-400 text-sm">Please provide details about your issue so our team can assist you.</p>
                </div>
                
                <form onSubmit={handleCreateSubmit} className="space-y-5 bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">Type</label>
                      <select
                        value={newTicket.type}
                        onChange={(e) => setNewTicket({ ...newTicket, type: e.target.value })}
                        className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="support">General Support</option>
                        <option value="billing">Billing Issue</option>
                        <option value="technical">Technical Support</option>
                        <option value="feature">Feature Request</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">Priority</label>
                      <select
                        value={newTicket.priority}
                        onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                        className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Subject</label>
                    <input
                      required
                      type="text"
                      value={newTicket.subject}
                      onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                      className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                      placeholder="Brief description of the issue"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Message</label>
                    <textarea
                      required
                      rows={6}
                      value={newTicket.message}
                      onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                      className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 resize-none"
                      placeholder="Provide as much detail as possible..."
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveTicket(null)}
                      className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={isSubmitting}
                      type="submit"
                      className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {isSubmitting ? "Creating..." : "Create Ticket"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : currentTicket ? (
            <>
              {/* Chat Header */}
              <div className="px-6 py-4 border-b border-white/5 shrink-0 flex justify-between items-start bg-zinc-950/30">
                <div>
                  <h2 className="text-lg font-bold text-white mb-1">{currentTicket.subject}</h2>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-zinc-500 capitalize">{currentTicket.type}</span>
                    <span className="text-zinc-700">•</span>
                    <span className={`font-medium ${
                      currentTicket.status === 'open' ? 'text-emerald-400' : 
                      currentTicket.status === 'pending' ? 'text-orange-400' : 'text-zinc-500'
                    }`}>
                      {currentTicket.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-black/20">
                {/* The initial ticket message */}
                <div className="flex flex-col items-end">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-xs font-medium text-zinc-400">You</span>
                    <span className="text-[10px] text-zinc-600">{new Date(currentTicket.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="p-4 rounded-2xl max-w-[80%] text-sm leading-relaxed bg-emerald-600/20 border border-emerald-500/30 text-emerald-50 rounded-tr-sm">
                    {currentTicket.message}
                  </div>
                </div>

                {currentTicket.messages?.map((msg: any, idx: number) => (
                  <div key={idx} className={`flex flex-col ${!msg.isAgent ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-xs font-medium text-zinc-400">{msg.isAgent ? 'Support Agent' : 'You'}</span>
                      <span className="text-[10px] text-zinc-600">{new Date(msg.createdAt).toLocaleString()}</span>
                    </div>
                    <div className={`p-4 rounded-2xl max-w-[80%] text-sm leading-relaxed ${
                      !msg.isAgent 
                        ? 'bg-emerald-600/20 border border-emerald-500/30 text-emerald-50 rounded-tr-sm' 
                        : 'bg-zinc-900 border border-white/10 text-zinc-200 rounded-tl-sm shadow-sm'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              {currentTicket.status !== 'resolved' && (
                <div className="p-4 border-t border-white/5 shrink-0 bg-zinc-950/50">
                  <div className="flex items-center gap-2 max-w-4xl mx-auto">
                    <button className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors">
                      <Paperclip className="w-5 h-5" />
                    </button>
                    <input 
                      type="text" 
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="Reply to this ticket..." 
                      className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && reply) handleReply();
                      }}
                    />
                    <button 
                      onClick={handleReply}
                      disabled={!reply}
                      className="p-2.5 bg-emerald-500 text-white rounded-xl disabled:opacity-50 disabled:bg-zinc-800 hover:bg-emerald-600 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
              <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
              <p>Select a ticket to view the conversation</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
