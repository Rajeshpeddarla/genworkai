"use client";

import { useState, useEffect } from "react";
import { 
  Settings, User, CreditCard, Gift, Palette, Key, LogOut, Loader2, Sparkles, Server, History
} from "lucide-react";
import { useTheme } from "next-themes";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { initializePaddle, Paddle } from "@paddle/paddle-js";
import { formatBytes } from "@/lib/utils";
import { CreditHistoryTab } from "@/components/billing/CreditHistoryTab";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [data, setData] = useState<any>(null);
  const [paddle, setPaddle] = useState<Paddle>();
  const [loading, setLoading] = useState(true);
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  useEffect(() => {
    fetch('/api/profile')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);

        // Initialize Paddle for direct checkout
        const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || '';
        const env = token.startsWith('live_') ? 'production' : 'sandbox';
        initializePaddle({ environment: env as any, token }).then(p => {
          if (p) setPaddle(p);
        });
      })
      .catch(() => setLoading(false));
  }, []);

  const handleUpgrade = () => {
    if (!paddle) {
      alert("Billing system is initializing, please wait a moment.");
      return;
    }
    const proPlan = data?.plans?.find((p: any) => p.slug === 'pro');
    if (!proPlan?.paddleMonthlyPriceId) {
      alert("Pro plan price ID is not configured yet. Please contact support.");
      return;
    }
    
    console.log("=== PADDLE CHECKOUT DEBUG ===");
    console.log("Token:", process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN);
    console.log("Environment:", process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN?.startsWith('live_') ? 'production' : 'sandbox');
    console.log("Price ID being sent:", proPlan.paddleMonthlyPriceId);
    console.log("Full Plan Object:", proPlan);
    
    try {
      paddle.Checkout.open({
        items: [{ priceId: proPlan.paddleMonthlyPriceId, quantity: 1 }]
      });
    } catch (e) {
      console.error("Paddle Checkout Error:", e);
    }
  };

  const handleLogout = async () => {
    // Clear local Supabase session
    await supabase.auth.signOut();
    
    // Clear server Supabase session and frontend_auth cookie
    await fetch('/api/auth/signout', { method: 'POST' });
    
    // Fallback manual frontend_auth clear just in case
    document.cookie = "frontend_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    
    // Hard redirect to login to bypass client router cache
    window.location.href = '/login';
  };

  const tabs = [
    { id: "profile", name: "Profile", icon: User },
    { id: "subscription", name: "Subscription & Limits", icon: CreditCard },
    { id: "credit-history", name: "Credit History", icon: History },
    { id: "referrals", name: "Refer & Earn", icon: Gift },
    { id: "appearance", name: "Appearance", icon: Palette },
  ];

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-violet-500" /></div>;
  }

  const profile = data?.profile;
  const limits = data?.limits;
  const isPro = profile?.tier === "pro";

  return (
    <div className="w-full px-6 lg:px-12 pb-12 space-y-8 mt-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg border border-zinc-200 dark:border-zinc-700">
              <Settings className="w-6 h-6" />
            </div>
            Settings
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Manage your account preferences and workspace configuration.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Nav */}
        <div className="w-full md:w-64 shrink-0 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                activeTab === tab.id 
                  ? "bg-violet-500/10 text-violet-700 dark:text-violet-400 shadow-sm border border-violet-500/20" 
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5"
              }`}
            >
              <tab.icon className="w-5 h-5" /> {tab.name}
            </button>
          ))}
          
          <div className="pt-4 mt-4 border-t border-zinc-200 dark:border-white/10">
            <Link href="/mcp-builder" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors">
               <Server className="w-5 h-5" /> MCP Servers
            </Link>
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors mt-2">
               <LogOut className="w-5 h-5" /> Sign Out
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1">
          
          {activeTab === "profile" && (
            <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/10 rounded-3xl p-8 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-1">Profile Details</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">Your personal information and identity.</p>
                
                <div className="flex items-center gap-6 mb-8">
                  {profile?.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="Avatar" className="w-20 h-20 rounded-full object-cover shadow-xl border-4 border-zinc-100 dark:border-zinc-900" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-3xl text-white font-bold shadow-xl border-4 border-zinc-100 dark:border-zinc-900 uppercase">
                      {profile?.fullName?.charAt(0) || profile?.email?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div className="space-y-2">
                    <p className="font-semibold text-lg">{profile?.fullName || "No Name Set"}</p>
                    <p className="text-zinc-500">{profile?.email}</p>
                  </div>
                </div>

                <div className="p-4 bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/5 rounded-xl">
                  <p className="text-sm text-zinc-500 mb-2">Member since</p>
                  <p className="font-medium">{new Date(profile?.createdAt || Date.now()).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "credit-history" && (
            <CreditHistoryTab />
          )}

          {activeTab === "subscription" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Current Plan Card */}
              <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-3xl p-8 shadow-xl text-white relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] pointer-events-none" />
                 <div className="flex justify-between items-start relative z-10">
                    <div>
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider mb-4 border border-white/30">
                         {isPro ? <><Sparkles className="w-3 h-3" /> Pro Tier</> : "Free Tier"}
                      </div>
                      <h2 className="text-3xl font-bold mb-2">{isPro ? "GenWorkAI Pro" : "GenWorkAI Starter"}</h2>
                      <p className="text-white/80">{isPro ? "You have unlimited access to all features." : "Upgrade to Pro to unlock unlimited KBs, Flows, and MCP servers."}</p>
                    </div>
                    {!isPro && (
                      <button onClick={handleUpgrade} className="bg-white text-zinc-900 font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-white/25 transition-all hover:-translate-y-0.5 inline-block">
                        Upgrade Now
                      </button>
                    )}
                    {isPro && profile?.paddleCustomerId && (
                      <a href={`https://paddle.com/portal/customer/${profile.paddleCustomerId}`} target="_blank" rel="noopener noreferrer" className="bg-white/20 text-white font-bold px-6 py-3 rounded-xl shadow-lg hover:bg-white/30 transition-all hover:-translate-y-0.5 inline-block backdrop-blur-md">
                        Manage Billing
                      </a>
                    )}
                 </div>
              </div>

              {/* Usage Limits */}
              {limits && (
                <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/10 rounded-3xl p-8 shadow-sm">
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">Current Usage</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium">Knowledge Bases</span>
                        <span className="text-zinc-500">{limits.knowledgeBases?.current || 0} / {Number(limits.knowledgeBases?.limit) === -1 ? 'Unlimited' : limits.knowledgeBases?.limit || 0}</span>
                      </div>
                      <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2">
                        <div className="bg-violet-500 h-2 rounded-full" style={{ width: `${Number(limits.knowledgeBases?.limit) === -1 ? 100 : limits.knowledgeBases?.limit > 0 ? Math.min(100, ((limits.knowledgeBases?.current || 0) / limits.knowledgeBases.limit) * 100) : 0}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium">Business Flows</span>
                        <span className="text-zinc-500">{limits.flows?.current || 0} / {Number(limits.flows?.limit) === -1 ? 'Unlimited' : limits.flows?.limit || 0}</span>
                      </div>
                      <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2">
                        <div className="bg-fuchsia-500 h-2 rounded-full" style={{ width: `${Number(limits.flows?.limit) === -1 ? 100 : limits.flows?.limit > 0 ? Math.min(100, ((limits.flows?.current || 0) / limits.flows.limit) * 100) : 0}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium">AI Credits Available</span>
                        <span className="text-zinc-500">{limits.aiCredits?.current?.toLocaleString() || 0} Credits</span>
                      </div>
                      <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2">
                        <div className="bg-sky-500 h-2 rounded-full" style={{ width: `100%` }}></div>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">Includes {limits.aiCredits?.monthly?.toLocaleString() || 0} monthly plan credits and {limits.aiCredits?.purchased?.toLocaleString() || 0} purchased credits.</p>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium">Context Data Uploaded</span>
                        <span className="text-zinc-500">{formatBytes(limits.context?.current || 0)} / {Number(limits.context?.limit) === -1 ? 'Unlimited' : formatBytes(limits.context?.limit || 0)}</span>
                      </div>
                      <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2">
                        <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${Number(limits.context?.limit) === -1 ? 100 : limits.context?.limit > 0 ? Math.min(100, ((limits.context?.current || 0) / limits.context.limit) * 100) : 0}%` }}></div>
                      </div>
                    </div>


                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "referrals" && (
            <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/10 rounded-3xl p-8 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center mb-8">
                 <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 mx-auto mb-4">
                   <Gift className="w-8 h-8" />
                 </div>
                 <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Refer & Earn</h2>
                 <p className="text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto">
                   We won't give anything permanent until referrer hasn't purchased. We give free context, and size increase for one existing knowledgebase. If his referrer has subscribed he get 1 month of the tier their referrer subscribed. After that ends even if referer subscribed he wont get any.
                 </p>
              </div>

              <div className="bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl p-6 text-center">
                 <p className="text-sm text-zinc-500 mb-2">Your Unique Referral Code</p>
                 <div className="flex items-center justify-center gap-3">
                   <code className="text-3xl font-black tracking-widest text-zinc-900 dark:text-white">{profile?.referralCode || "LOADING"}</code>
                 </div>
                 <button className="mt-4 text-violet-600 dark:text-violet-400 text-sm font-semibold hover:underline">
                   Copy Invite Link
                 </button>
              </div>

              <div className="mt-8 pt-8 border-t border-zinc-200 dark:border-white/10">
                 <h3 className="font-bold mb-4 flex items-center justify-between">
                   <span>Referred Members</span>
                   <span className="bg-zinc-200 dark:bg-white/10 text-zinc-700 dark:text-zinc-300 px-3 py-1 rounded-full text-xs">{data?.referrals?.count || 0} Joined</span>
                 </h3>
                 
                 {data?.referrals?.members?.length > 0 ? (
                    <div className="space-y-3">
                      {data.referrals.members.map((member: any) => (
                        <div key={member.id} className="flex justify-between items-center p-4 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black/20">
                          <div>
                            <span className="font-bold block">{member.fullName}</span>
                            <span className="text-xs text-zinc-500">Joined {new Date(member.createdAt).toLocaleDateString()}</span>
                          </div>
                          <span className="text-xs px-3 py-1 rounded-full bg-violet-500/20 text-violet-700 dark:text-violet-400 uppercase font-bold tracking-wider">
                            {member.tier}
                          </span>
                        </div>
                      ))}
                    </div>
                 ) : (
                    <div className="text-center p-8 border border-dashed border-zinc-300 dark:border-white/20 rounded-xl">
                      <p className="text-sm text-zinc-500">You haven't referred anyone yet. Share your code to unlock massive rewards!</p>
                    </div>
                 )}
              </div>
            </div>
          )}

          {activeTab === "appearance" && (
            <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/10 rounded-3xl p-8 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-1">Appearance</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">Customize the look and feel of your GenWorkAI workspace.</p>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div 
                      onClick={() => setTheme("dark")}
                      className={`border-2 ${theme === 'dark' ? 'border-fuchsia-500' : 'border-zinc-200 dark:border-white/10'} rounded-xl p-4 cursor-pointer bg-gradient-to-br from-[#1c0b2b] to-[#0a0514] transition-all`}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm font-medium text-fuchsia-300">Aura Dark</span>
                      </div>
                      <div className="w-full h-20 rounded bg-gradient-to-br from-fuchsia-900/40 to-violet-900/40 border border-fuchsia-500/20"></div>
                    </div>

                    <div 
                      onClick={() => setTheme("light")}
                      className={`border-2 ${theme === 'light' ? 'border-violet-500' : 'border-zinc-200 dark:border-white/10'} rounded-xl p-4 cursor-pointer bg-white transition-all`}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm font-medium text-zinc-900">Light Mode</span>
                      </div>
                      <div className="w-full h-20 rounded bg-gradient-to-br from-zinc-100 to-white border border-zinc-200"></div>
                    </div>


                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}