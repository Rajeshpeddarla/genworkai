"use client";

import { useState } from "react";
import { Search, Filter, MessageSquare, Clock, CheckCircle2, User, Send, Paperclip, MoreVertical } from "lucide-react";
import { replyToTicket, markTicketResolved } from "./actions";

export default function TicketsClient({ initialTickets, currentUserId }: { initialTickets: any[], currentUserId: string }) {
  const [activeTicket, setActiveTicket] = useState<string | null>(initialTickets[0]?.id || null);
  const [reply, setReply] = useState("");

  const currentTicket = initialTickets.find(t => t.id === activeTicket);

  const handleSend = async () => {
    if (!reply.trim() || !activeTicket) return;
    const content = reply;
    setReply("");
    await replyToTicket(activeTicket, currentUserId, content);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-6">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Support Tickets</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Manage user support requests and chat operations.</p>
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-2xl overflow-hidden flex shadow-sm min-h-0">
        {/* Left Pane - Ticket List */}
        <div className="w-1/3 border-r border-zinc-200 dark:border-white/10 flex flex-col bg-zinc-50 dark:bg-zinc-900/30">
          <div className="p-4 border-b border-zinc-200 dark:border-white/10 shrink-0">
            <div className="flex items-center gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input 
                  type="text" 
                  placeholder="Search tickets..." 
                  className="w-full bg-white dark:bg-black border border-zinc-200 dark:border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>
              <button className="p-2 bg-white dark:bg-black border border-zinc-200 dark:border-white/10 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
                <Filter className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-rose-500/10 text-rose-500 rounded-full text-xs font-bold border border-rose-500/20">Open ({initialTickets.filter(t => t.status === 'open').length})</span>
              <span className="px-3 py-1 bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-full text-xs font-medium cursor-pointer hover:bg-zinc-300 dark:hover:bg-zinc-700">Resolved ({initialTickets.filter(t => t.status === 'resolved').length})</span>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {initialTickets.map(ticket => (
              <div 
                key={ticket.id} 
                onClick={() => setActiveTicket(ticket.id)}
                className={`p-4 border-b border-zinc-200 dark:border-white/5 cursor-pointer transition-colors ${
                  activeTicket === ticket.id 
                    ? 'bg-white dark:bg-white/5 border-l-4 border-l-rose-500' 
                    : 'hover:bg-zinc-100 dark:hover:bg-white/5 border-l-4 border-l-transparent'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-zinc-900 dark:text-white">{ticket.userName || ticket.userEmail}</span>
                  <span className="text-xs text-zinc-500">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="text-sm font-medium text-zinc-800 dark:text-zinc-300 mb-2">{ticket.subject}</div>
                <div className="flex justify-between items-center">
                  <span className={`text-xs font-bold uppercase ${
                    ticket.priority === 'urgent' ? 'text-rose-500' : 
                    ticket.priority === 'high' ? 'text-orange-500' : 'text-blue-500'
                  }`}>{ticket.priority}</span>
                  <span className={`flex items-center gap-1 text-xs font-medium ${
                    ticket.status === 'open' ? 'text-rose-500' : 
                    ticket.status === 'pending' ? 'text-orange-500' : 'text-emerald-500'
                  }`}>
                    {ticket.status === 'resolved' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    {ticket.status}
                  </span>
                </div>
              </div>
            ))}
            {initialTickets.length === 0 && (
              <div className="p-8 text-center text-zinc-500">No tickets found</div>
            )}
          </div>
        </div>

        {/* Right Pane - Chat View */}
        <div className="flex-1 flex flex-col bg-white dark:bg-[#020202]">
          {currentTicket ? (
            <>
              {/* Chat Header */}
              <div className="p-6 border-b border-zinc-200 dark:border-white/10 shrink-0 flex justify-between items-start bg-zinc-50 dark:bg-zinc-900/30">
                <div>
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-1">{currentTicket.subject}</h2>
                  <div className="flex items-center gap-4 text-sm text-zinc-500">
                    <span className="flex items-center gap-1"><User className="w-4 h-4" /> {currentTicket.userName || 'Unknown'}</span>
                    <span>{currentTicket.userEmail}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {currentTicket.status !== 'resolved' && (
                    <button 
                      onClick={() => markTicketResolved(currentTicket.id)}
                      className="px-4 py-2 border border-zinc-200 dark:border-white/10 rounded-lg text-sm font-medium hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                    >
                      Mark as Resolved
                    </button>
                  )}
                  <button className="p-2 border border-zinc-200 dark:border-white/10 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-zinc-50/50 dark:bg-transparent">
                {/* The initial ticket message */}
                <div className="flex flex-col items-start">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-xs font-medium text-zinc-500">{currentTicket.userName || 'User'}</span>
                    <span className="text-xs text-zinc-600 dark:text-zinc-500">{new Date(currentTicket.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="p-4 rounded-2xl max-w-[80%] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-zinc-800 dark:text-zinc-200 rounded-tl-sm shadow-sm">
                    {currentTicket.message}
                  </div>
                </div>
                
                {/* The threaded messages */}
                {currentTicket.messages?.map((msg: any, idx: number) => (
                  <div key={idx} className={`flex flex-col ${msg.isAgent ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-xs font-medium text-zinc-500">{msg.isAgent ? 'Support Agent' : currentTicket.userName}</span>
                      <span className="text-xs text-zinc-600 dark:text-zinc-500">{new Date(msg.createdAt).toLocaleString()}</span>
                    </div>
                    <div className={`p-4 rounded-2xl max-w-[80%] ${
                      msg.isAgent 
                        ? 'bg-rose-600 text-white rounded-tr-sm' 
                        : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-zinc-800 dark:text-zinc-200 rounded-tl-sm shadow-sm'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              {currentTicket.status !== 'resolved' && (
                <div className="p-4 border-t border-zinc-200 dark:border-white/10 shrink-0 bg-white dark:bg-zinc-950">
                  <div className="flex items-center gap-2">
                    <button className="p-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
                      <Paperclip className="w-5 h-5" />
                    </button>
                    <input 
                      type="text" 
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="Type your reply here..." 
                      className="flex-1 bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSend();
                      }}
                    />
                    <button 
                      onClick={handleSend}
                      disabled={!reply.trim()}
                      className="p-3 bg-rose-600 text-white rounded-xl disabled:opacity-50 hover:bg-rose-700 transition-colors"
                    >
                      <Send className="w-5 h-5" />
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
