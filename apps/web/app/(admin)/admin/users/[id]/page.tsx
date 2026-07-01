"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, User, Mail, Calendar, Shield, Database, BrainCircuit, Terminal, Activity, Zap, Ticket } from "lucide-react";

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [activeTab, setActiveTab] = useState("profile");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/users/${resolvedParams.id}`)
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, [resolvedParams.id]);

  if (loading) {
    return <div className="p-8 animate-pulse text-zinc-500">Loading user details...</div>;
  }

  if (!data || data.error) {
    return <div className="p-8 text-rose-500">Failed to load user details: {data?.error || "Unknown Error"}</div>;
  }

  const { profile, subscription, resources, metrics } = data;

  return (
    <div className="space-y-6">
      <Link href="/admin/users" className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white flex items-center gap-2 text-sm font-medium transition-colors w-fit">
        <ArrowLeft className="w-4 h-4" /> Back to Users
      </Link>

      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 blur-[100px] rounded-full"></div>
        <div className="flex items-start gap-6 relative z-10">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-rose-500 to-orange-500 text-white flex items-center justify-center text-4xl font-bold shadow-xl">
            A
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
              {profile.firstName || 'Unknown'} {profile.lastName || ''}
              {profile.isActive ? (
                <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-500 rounded-full">Active</span>
              ) : (
                <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-rose-500/20 text-rose-500 rounded-full">Suspended</span>
              )}
            </h1>
            <p className="text-zinc-500 mt-2 flex items-center gap-4">
              <span className="flex items-center gap-1"><Mail className="w-4 h-4" /> {profile.email}</span>
              <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Joined {new Date(profile.createdAt).toLocaleDateString()}</span>
              {profile.isAdmin && <span className="flex items-center gap-1 text-rose-500"><Shield className="w-4 h-4" /> Admin</span>}
            </p>
          </div>
          <div>
             <button className="px-4 py-2 border border-zinc-200 dark:border-white/10 rounded-xl font-medium hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
               Edit Profile
             </button>
          </div>
        </div>
      </div>

      <div className="flex space-x-1 p-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl w-fit overflow-x-auto">
        {[
          { id: "profile", label: "Profile & Plan", icon: User },
          { id: "usage", label: "Usage Metrics", icon: Activity },
          { id: "kbs", label: "Knowledge Bases", icon: BrainCircuit },
          { id: "dbs", label: "Databases", icon: Database },
          { id: "automations", label: "Automations", icon: Zap },
          { id: "apikeys", label: "API & MCP", icon: Terminal },
          { id: "tickets", label: "Support Tickets", icon: Ticket },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? "bg-rose-600 text-white shadow-md"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-2xl p-6 min-h-[400px]">
         {activeTab === 'profile' && (
           <div className="space-y-8">
             <div>
               <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Subscription Details</h3>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <div className="p-4 bg-zinc-50 dark:bg-white/5 rounded-xl border border-zinc-200 dark:border-white/10">
                   <p className="text-sm text-zinc-500">Current Plan</p>
                   <p className="text-xl font-bold text-zinc-900 dark:text-white mt-1">{subscription?.planName || 'Free Tier'}</p>
                 </div>
                 <div className="p-4 bg-zinc-50 dark:bg-white/5 rounded-xl border border-zinc-200 dark:border-white/10">
                   <p className="text-sm text-zinc-500">Billing Cycle</p>
                   <p className="text-xl font-bold text-zinc-900 dark:text-white mt-1 capitalize">{subscription?.billingCycle || 'N/A'}</p>
                 </div>
                 <div className="p-4 bg-zinc-50 dark:bg-white/5 rounded-xl border border-zinc-200 dark:border-white/10">
                   <p className="text-sm text-zinc-500">Renewal Date</p>
                   <p className="text-xl font-bold text-zinc-900 dark:text-white mt-1">{subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : 'N/A'}</p>
                 </div>
                 <div className="p-4 bg-zinc-50 dark:bg-white/5 rounded-xl border border-zinc-200 dark:border-white/10">
                   <p className="text-sm text-zinc-500">Status</p>
                   <p className="text-xl font-bold text-emerald-500 mt-1 capitalize">{subscription?.status || 'Active'}</p>
                 </div>
               </div>
             </div>
             
             <div className="pt-6 border-t border-zinc-200 dark:border-white/10">
               <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Danger Zone</h3>
               <div className="flex gap-4">
                 <button className="px-4 py-2 border border-rose-500/50 text-rose-500 rounded-xl font-medium hover:bg-rose-500/10 transition-colors">
                   Suspend Account
                 </button>
                 <button className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-medium transition-colors">
                   Delete Account
                 </button>
               </div>
             </div>
           </div>
         )}

         {activeTab === 'usage' && (
           <div className="space-y-6">
             <h3 className="text-lg font-bold text-zinc-900 dark:text-white">AI Credit Usage</h3>
             <div className="p-6 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl">
               <p className="text-sm text-zinc-500 font-medium">Lifetime AI Credits Consumed</p>
               <p className="text-3xl font-bold text-zinc-900 dark:text-white mt-2">{Number(metrics?.totalAiCreditsConsumed || 0).toLocaleString()}</p>
             </div>
           </div>
         )}
         {activeTab === 'kbs' && (
           <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
             <BrainCircuit className="w-12 h-12 mb-4 text-zinc-300" />
             <p className="text-lg font-medium">User has created {resources.knowledgeBases} Knowledge Base(s)</p>
           </div>
         )}
         {activeTab === 'dbs' && (
           <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
             <Database className="w-12 h-12 mb-4 text-zinc-300" />
             <p className="text-lg font-medium">User has connected {resources.databases} Database(s)</p>
           </div>
         )}
         {activeTab === 'automations' && (
           <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
             <Zap className="w-12 h-12 mb-4 text-zinc-300" />
             <p className="text-lg font-medium">User has created {resources.automations} Automation(s)</p>
           </div>
         )}
         {activeTab === 'apikeys' && (
           <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
             <Terminal className="w-12 h-12 mb-4 text-zinc-300" />
             <p className="text-lg font-medium">User has generated {resources.apiKeys} API Key(s)</p>
           </div>
         )}
         {activeTab === 'tickets' && (
           <div className="flex items-center justify-center h-64 text-zinc-500">Tickets integration pending...</div>
         )}
      </div>
    </div>
  );
}
