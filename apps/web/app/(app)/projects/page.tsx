"use client";

import { useState } from "react";
import { 
  FolderKanban, 
  Plus, 
  Search, 
  Users, 
  FileText, 
  MessageSquare, 
  ServerCog, 
  MoreVertical,
  Activity,
  ArrowRight,
  Filter
} from "lucide-react";
import Link from "next/link";

export default function ProjectsPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
              <FolderKanban className="w-6 h-6" />
            </div>
            Projects
          </h1>
          <p className="text-zinc-400 mt-1">Organize your research, extractions, and teams by workspace.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-600/20">
            <Plus className="w-4 h-4" /> New Project
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 border-b border-white/10 pb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Search projects..." 
            className="w-full bg-zinc-900/50 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
          />
        </div>
        <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 transition-colors text-zinc-300">
          <Filter className="w-4 h-4" /> Filter
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Project Card 1 */}
        <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-6 backdrop-blur-sm group hover:border-emerald-500/50 transition-all flex flex-col cursor-pointer relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <FolderKanban className="w-24 h-24 text-emerald-400" />
          </div>
          
          <div className="flex items-start justify-between mb-4 relative z-10">
            <h3 className="text-xl font-bold text-white">Q3 Product Launch</h3>
            <button className="text-zinc-500 hover:text-white p-1">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
          
          <p className="text-sm text-zinc-400 line-clamp-2 mb-6 flex-1 relative z-10">
            All research, competitor analysis, and documentation regarding the upcoming GenWorkAI V2 launch.
          </p>
          
          <div className="grid grid-cols-2 gap-3 mb-6 relative z-10">
            <div className="bg-white/5 border border-white/5 rounded-lg p-3">
              <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
                <FileText className="w-3 h-3" /> Reports
              </div>
              <div className="text-lg font-semibold text-white">14</div>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-lg p-3">
              <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
                <MessageSquare className="w-3 h-3" /> Chats
              </div>
              <div className="text-lg font-semibold text-white">8</div>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-lg p-3">
              <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
                <ServerCog className="w-3 h-3" /> MCPs
              </div>
              <div className="text-lg font-semibold text-white">2</div>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-lg p-3">
              <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
                <Users className="w-3 h-3" /> Team
              </div>
              <div className="flex -space-x-2">
                <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-zinc-900 flex items-center justify-center text-[10px] text-white">T</div>
                <div className="w-6 h-6 rounded-full bg-pink-500 border-2 border-zinc-900 flex items-center justify-center text-[10px] text-white">S</div>
                <div className="w-6 h-6 rounded-full bg-emerald-500 border-2 border-zinc-900 flex items-center justify-center text-[10px] text-white">+2</div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Activity className="w-3 h-3" /> Updated 2 hrs ago
            </div>
            <div className="text-sm font-medium text-emerald-400 group-hover:text-emerald-300 flex items-center gap-1">
              Open <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Project Card 2 */}
        <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-6 backdrop-blur-sm group hover:border-emerald-500/50 transition-all flex flex-col cursor-pointer relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <FolderKanban className="w-24 h-24 text-emerald-400" />
          </div>
          
          <div className="flex items-start justify-between mb-4 relative z-10">
            <h3 className="text-xl font-bold text-white">Frontend Architecture Revamp</h3>
            <button className="text-zinc-500 hover:text-white p-1">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
          
          <p className="text-sm text-zinc-400 line-clamp-2 mb-6 flex-1 relative z-10">
            Researching Next.js 16 migrations, state management alternatives, and performance benchmarks.
          </p>
          
          <div className="grid grid-cols-2 gap-3 mb-6 relative z-10">
            <div className="bg-white/5 border border-white/5 rounded-lg p-3">
              <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
                <FileText className="w-3 h-3" /> Reports
              </div>
              <div className="text-lg font-semibold text-white">3</div>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-lg p-3">
              <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
                <MessageSquare className="w-3 h-3" /> Chats
              </div>
              <div className="text-lg font-semibold text-white">12</div>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-lg p-3">
              <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
                <ServerCog className="w-3 h-3" /> MCPs
              </div>
              <div className="text-lg font-semibold text-white">1</div>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-lg p-3">
              <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
                <Users className="w-3 h-3" /> Team
              </div>
              <div className="flex -space-x-2">
                <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-zinc-900 flex items-center justify-center text-[10px] text-white">T</div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Activity className="w-3 h-3" /> Updated yesterday
            </div>
            <div className="text-sm font-medium text-emerald-400 group-hover:text-emerald-300 flex items-center gap-1">
              Open <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}