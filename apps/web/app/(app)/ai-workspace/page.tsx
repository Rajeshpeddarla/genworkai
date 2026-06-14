"use client";

import { useState } from "react";
import { 
  MessageSquare, 
  Settings, 
  Plus, 
  MoreVertical, 
  Paperclip, 
  Send, 
  Bot, 
  User, 
  FileText, 
  Globe, 
  GitBranch, 
  Database,
  Image as ImageIcon,
  Video,
  PanelRightClose,
  PanelRightOpen,
  ChevronDown,
  ServerCog
} from "lucide-react";

export default function AiWorkspacePage() {

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-zinc-950/50 rounded-3xl border border-white/10 overflow-hidden backdrop-blur-md shadow-2xl">
      
      {/* Left Sidebar - Chat History & Tabs */}
      <div className="w-72 border-r border-white/10 bg-black/20 flex flex-col hidden md:flex">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="font-semibold text-white">Conversations</h2>
          <button onClick={() => alert("Started a new conversation!")} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-zinc-400 hover:text-white">
            <Plus className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {/* Chat Session Items */}
          <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 cursor-pointer">
            <div className="text-sm font-medium text-violet-100 truncate">Q3 Market Report Analysis</div>
            <div className="text-xs text-violet-300 mt-1 flex items-center gap-2">
              <FileText className="w-3 h-3" /> 2 attached docs
            </div>
          </div>
          
          <div className="p-3 rounded-xl hover:bg-white/5 border border-transparent cursor-pointer group transition-colors">
            <div className="text-sm font-medium text-zinc-300 group-hover:text-zinc-100 truncate">React Codebase Refactoring</div>
            <div className="text-xs text-zinc-500 mt-1 flex items-center gap-2">
              <GitBranch className="w-3 h-3" /> ui-components repo
            </div>
          </div>

          <div className="p-3 rounded-xl hover:bg-white/5 border border-transparent cursor-pointer group transition-colors">
            <div className="text-sm font-medium text-zinc-300 group-hover:text-zinc-100 truncate">Pricing Page Copywriting</div>
            <div className="text-xs text-zinc-500 mt-1 flex items-center gap-2">
              <MessageSquare className="w-3 h-3" /> Just now
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Chat Header */}
        <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-black/10">
          <div className="flex items-center gap-3">
            <div className="font-semibold text-white">Q3 Market Report Analysis</div>
            <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs text-zinc-300 font-medium border border-white/10">
              GPT-4o
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-zinc-400">
              <Settings className="w-5 h-5" />
            </button>
            <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-zinc-400">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* User Message */}
          <div className="flex gap-4 max-w-3xl mx-auto">
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 border border-white/10">
              <User className="w-5 h-5 text-zinc-400" />
            </div>
            <div className="space-y-2">
              <div className="font-medium text-sm text-zinc-300">You</div>
              <div className="text-zinc-100 leading-relaxed">
                Can you summarize the key findings from the two attached documents regarding European market expansion?
              </div>
              {/* Attached Pills */}
              <div className="flex flex-wrap gap-2 pt-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-zinc-300 cursor-pointer hover:bg-white/10 transition-colors">
                  <FileText className="w-4 h-4 text-blue-400" />
                  Q3_EU_Analysis.pdf
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-zinc-300 cursor-pointer hover:bg-white/10 transition-colors">
                  <FileText className="w-4 h-4 text-blue-400" />
                  Competitor_Intel_Draft.docx
                </div>
              </div>
            </div>
          </div>

          {/* AI Response */}
          <div className="flex gap-4 max-w-3xl mx-auto">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="space-y-4 w-full">
              <div className="font-medium text-sm text-violet-300">GenWorkAI</div>
              
              <div className="prose prose-invert max-w-none text-zinc-300 prose-p:leading-relaxed prose-pre:bg-zinc-900/50 prose-pre:border prose-pre:border-white/10 prose-headings:text-zinc-100">
                <p>Based on the attached documents, here are the key findings regarding European market expansion for Q3:</p>
                <ul>
                  <li><strong>Market Growth:</strong> The EU sector has seen a <span className="text-emerald-400">14% YoY growth</span>, particularly strong in the DACH region.</li>
                  <li><strong>Competitor Movement:</strong> According to the intel draft, two major competitors have delayed their product launches to Q4, creating a 6-week window of opportunity.</li>
                  <li><strong>Regulatory Hurdles:</strong> You will need to address the new AI Act compliance requirements before entering the French market.</li>
                </ul>
                <p>Would you like me to draft an executive summary of these points for the board meeting?</p>
              </div>

              {/* Citations/Sources block */}
              <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap gap-2">
                <span className="text-xs text-zinc-500 mr-2 flex items-center">Sources:</span>
                <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 cursor-pointer hover:bg-blue-500/20">1. Q3_EU_Analysis.pdf (Page 4)</span>
                <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 cursor-pointer hover:bg-blue-500/20">2. Competitor_Intel_Draft.docx</span>
              </div>
            </div>
          </div>

        </div>

        {/* Input Area */}
        <div className="p-4 bg-black/20 border-t border-white/10">
          <div className="max-w-3xl mx-auto relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500/30 to-fuchsia-500/30 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-500"></div>
            <div className="relative bg-zinc-900 rounded-2xl border border-white/10 p-2 shadow-inner flex flex-col">
              
              <textarea 
                className="w-full bg-transparent border-0 resize-none text-zinc-100 placeholder:text-zinc-500 px-3 py-2 focus:ring-0 sm:text-sm min-h-[60px] max-h-48"
                placeholder="Message GenWorkAI or type '/' for commands..."
              />
              
              <div className="flex items-center justify-between px-2 pb-1 pt-2">
                <div className="flex items-center gap-1">
                  <button className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-white/5 rounded-lg transition-colors group/btn relative">
                    <Paperclip className="w-4 h-4" />
                    {/* Tooltip mockup */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-800 text-xs rounded opacity-0 group-hover/btn:opacity-100 pointer-events-none whitespace-nowrap transition-opacity">Attach Files</div>
                  </button>
                  <button className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-white/5 rounded-lg transition-colors">
                    <Globe className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-white/5 rounded-lg transition-colors">
                    <GitBranch className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-white/5 text-xs font-medium text-zinc-400 transition-colors border border-transparent hover:border-white/10">
                    <Database className="w-3 h-3" />
                    Knowledge Base
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </button>
                  <button className="p-2 bg-white text-black hover:bg-zinc-200 rounded-xl transition-all shadow-lg hover:shadow-xl">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="text-center mt-3">
            <span className="text-[10px] text-zinc-500">GenWorkAI can make mistakes. Consider verifying critical information.</span>
          </div>
        </div>
      </div>


    </div>
  );
}