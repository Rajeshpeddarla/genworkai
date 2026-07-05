"use client";

import { 
  Users, 
  UserPlus, 
  Shield, 
  Settings, 
  Search, 
  MoreVertical,
  Activity,
  Mail,
  CheckCircle2,
  Clock
} from "lucide-react";

export default function TeamPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
              <Users className="w-6 h-6" />
            </div>
            Team & Collaboration
          </h1>
          <p className="text-zinc-400 mt-1">Manage workspace members, roles, and shared access.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20">
            <UserPlus className="w-4 h-4" /> Invite Members
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Members List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card/50 border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
            
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Active Members (12)</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input 
                  type="text" 
                  placeholder="Search members..." 
                  className="bg-black/40 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm text-white focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              {/* Member 1 - Admin */}
              <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold shadow-lg">
                    V
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-white text-sm">Varun</h4>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/20">Owner</span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">varun@genwork.ai</p>
                  </div>
                </div>
                <button className="text-zinc-500 hover:text-white p-2">
                  <Settings className="w-4 h-4" />
                </button>
              </div>

              {/* Member 2 - Editor */}
              <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold">
                    S
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-white text-sm">Sarah Jenkins</h4>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">Editor</span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">sarah@genwork.ai</p>
                  </div>
                </div>
                <button className="text-zinc-500 hover:text-white p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>

              {/* Member 3 - Viewer */}
              <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold">
                    M
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-white text-sm">Mike Chen</h4>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-white/10 text-zinc-300 border border-white/10">Viewer</span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">mike@genwork.ai</p>
                  </div>
                </div>
                <button className="text-zinc-500 hover:text-white p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-white/10">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Pending Invites</h3>
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 border-dashed">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-medium text-zinc-300 text-sm">alex@genwork.ai</h4>
                    <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Invited 2 days ago
                    </p>
                  </div>
                </div>
                <button className="text-xs font-medium text-blue-400 hover:text-blue-300">Resend</button>
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: Roles & Activity */}
        <div className="space-y-6">
          
          {/* Roles Overview */}
          <div className="bg-card/50 border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-400" /> Roles & Permissions
            </h3>
            
            <div className="space-y-4">
              <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm text-white">Owner</span>
                  <span className="text-xs text-blue-400">1</span>
                </div>
                <p className="text-[10px] text-zinc-500">Full access to billing, team management, and all projects.</p>
              </div>
              
              <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm text-white">Editor</span>
                  <span className="text-xs text-zinc-400">4</span>
                </div>
                <p className="text-[10px] text-zinc-500">Can create reports, MCPs, and invite Viewers.</p>
              </div>

              <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm text-white">Viewer</span>
                  <span className="text-xs text-zinc-400">7</span>
                </div>
                <p className="text-[10px] text-zinc-500">Read-only access to assigned projects and reports.</p>
              </div>
            </div>
            
            <button className="w-full mt-4 py-2 rounded-xl border border-white/10 text-sm font-medium text-white hover:bg-white/5 transition-colors">
              Manage Roles
            </button>
          </div>

          {/* Activity Log */}
          <div className="bg-card/50 border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4" /> Team Activity
            </h3>
            
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="mt-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <div className="w-0.5 h-full bg-white/10 mx-auto -mb-4 mt-1"></div>
                </div>
                <div>
                  <p className="text-sm text-zinc-300">
                    <span className="font-medium text-white">Sarah</span> generated a new Research Report
                  </p>
                  <p className="text-xs text-zinc-500">2 hours ago</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="mt-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <div className="w-0.5 h-full bg-white/10 mx-auto -mb-4 mt-1"></div>
                </div>
                <div>
                  <p className="text-sm text-zinc-300">
                    <span className="font-medium text-white">Varun</span> updated the Team Roles
                  </p>
                  <p className="text-xs text-zinc-500">Yesterday</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="mt-1">
                  <div className="w-2 h-2 rounded-full bg-violet-500"></div>
                </div>
                <div>
                  <p className="text-sm text-zinc-300">
                    <span className="font-medium text-white">Mike</span> created a new MCP Server
                  </p>
                  <p className="text-xs text-zinc-500">2 days ago</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
