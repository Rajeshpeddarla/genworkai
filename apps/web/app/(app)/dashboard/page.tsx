"use client";

import { 
  FileText, 
  Video, 
  Globe, 
  Image as ImageIcon, 
  ServerCog, 
  CreditCard,
  Plus,
  MessageSquare,
  Search,
  UploadCloud,
  Activity,
  ArrowUpRight,
  MoreVertical,
  Database,
  Folders
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const quickActions = [
  { name: "Analyze URL", icon: Globe, href: "/research-studio", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" },
  { name: "Upload Document", icon: UploadCloud, href: "/file-studio", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20" },
  { name: "Upload Video", icon: Video, href: "/media-intelligence", color: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20" },
  { name: "Create MCP", icon: Plus, href: "/mcp-builder", color: "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20" },
  { name: "Start AI Chat", icon: MessageSquare, href: "/ai-workspace", color: "bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-500/20" },
  { name: "Create Research Report", icon: Search, href: "/research-studio", color: "bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-400 border-fuchsia-500/20" },
];

const recentActivity: any[] = [];

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/profile')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  }, []);

  const firstName = data?.profile?.fullName?.split(' ')[0] || "there";
  const artifactsCount = data?.limits?.artifacts?.current || 0;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-900/40 to-fuchsia-900/40 border border-white/10 p-8 sm:p-10">
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4 flex items-center gap-2">
            Welcome back, {isLoading ? <div className="h-10 w-48 bg-white/20 animate-pulse rounded-lg" /> : firstName}
          </h1>
          <p className="text-zinc-300 text-lg mb-8">
            You've generated {artifactsCount} artifacts this month using GenWorkAI. Ready to transform more content into actionable knowledge?
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/ai-workspace" className="bg-white text-zinc-950 px-6 py-3 rounded-xl font-semibold hover:bg-zinc-200 transition-colors inline-flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              New AI Chat
            </Link>
            <Link href="/research-studio" className="bg-white/10 text-white border border-white/20 px-6 py-3 rounded-xl font-semibold hover:bg-white/20 transition-colors inline-flex items-center gap-2 backdrop-blur-sm">
              <Search className="w-5 h-5" />
              Start Research
            </Link>
          </div>
        </div>
        {/* Abstract shapes for background */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-40 -mb-20 w-72 h-72 bg-fuchsia-500/20 rounded-full blur-3xl" />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-violet-500 dark:text-violet-400" /> Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickActions.map((action) => (
            <Link 
              key={action.name} 
              href={action.href}
              className={`flex flex-col items-center justify-center p-4 rounded-2xl border bg-white dark:bg-transparent transition-all hover:scale-[1.02] ${action.color} backdrop-blur-sm`}
            >
              <action.icon className="w-6 h-6 mb-3" />
              <span className="text-sm font-medium text-center">{action.name}</span>
            </Link>
          ))}
        </div>
      </div>



      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Folders className="w-5 h-5 text-blue-500 dark:text-blue-400" /> Recent Activity
            </h2>
            <Link href="/projects" className="text-sm text-violet-500 dark:text-violet-400 hover:text-violet-600 dark:hover:text-violet-300">View all</Link>
          </div>
          <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
            {recentActivity.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 dark:text-zinc-400 flex flex-col items-center">
                <Folders className="w-12 h-12 mb-3 opacity-20" />
                <p>No recent activity yet.</p>
              </div>
            ) : recentActivity.map((item, idx) => (
              <div key={item.id} className={`flex items-center justify-between p-4 px-6 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors cursor-pointer ${idx !== recentActivity.length - 1 ? 'border-b border-zinc-200 dark:border-white/5' : ''}`}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-white/5">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-zinc-900 dark:text-zinc-200">{item.title}</h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5">{item.type} • {item.date}</p>
                  </div>
                </div>
                <button className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white p-2 transition-colors">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Data Sources & MCPs */}
        <div className="space-y-4">
           <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-500 dark:text-emerald-400" /> Connections
          </h2>
          <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-2xl p-6 backdrop-blur-sm space-y-6">
            
            <div>
              <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-3 uppercase tracking-wider">Active MCP Servers</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                  <span className="text-sm text-zinc-700 dark:text-zinc-200">GitHub Repository Access</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                  <span className="text-sm text-zinc-700 dark:text-zinc-200">Notion Knowledge Base</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                  <span className="text-sm text-zinc-500">Jira Ticket System</span>
                </div>
              </div>
            </div>

            <div className="h-px bg-zinc-200 dark:bg-white/5 w-full" />

            <div>
              <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-3 uppercase tracking-wider">Data Sources</h3>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-md bg-zinc-100 dark:bg-white/5 px-2 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/10">Google Drive</span>
                <span className="inline-flex items-center rounded-md bg-zinc-100 dark:bg-white/5 px-2 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/10">Dropbox</span>
                <span className="inline-flex items-center rounded-md bg-zinc-100 dark:bg-white/5 px-2 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/10">Slack</span>
                <span className="inline-flex items-center rounded-md bg-zinc-50 dark:bg-white/5 px-2 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-300 border border-zinc-300 dark:border-white/10 border-dashed hover:bg-zinc-100 dark:hover:bg-white/10 cursor-pointer">+ Add Source</span>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
