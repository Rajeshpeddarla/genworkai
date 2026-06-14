"use client";

import { useState, useEffect } from "react";
import { Users, LayoutDashboard, Settings, Ticket, ShieldAlert, CheckCircle2, XCircle, Search, Edit2 } from "lucide-react";
import { formatBytes } from "@/lib/utils";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="space-y-6">
      <div className="flex space-x-1 p-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl w-fit">
        {["overview", "users", "config", "promotions"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-lg capitalize transition-all ${
              activeTab === tab
                ? "bg-violet-600 text-white shadow-md"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl p-6 shadow-xl">
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "users" && <UsersTab />}
        {activeTab === "config" && <ConfigTab />}
        {activeTab === "promotions" && <PromotionsTab />}
      </div>
    </div>
  );
}

// ---------------- OVERVIEW TAB ---------------- //
function OverviewTab() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats").then(res => res.json()).then(data => {
      setStats(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="animate-pulse flex space-x-4">Loading stats...</div>;
  if (!stats || stats.error) return <div className="text-red-500">Error loading stats</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard title="Total Users" value={stats.totalUsers} icon={<Users className="w-6 h-6 text-blue-500" />} />
      <StatCard title="Pro Subscribers" value={stats.subscriptions?.pro || 0} icon={<CheckCircle2 className="w-6 h-6 text-emerald-500" />} />
      <StatCard title="Total Knowledge Bases" value={stats.totalKbs} icon={<LayoutDashboard className="w-6 h-6 text-violet-500" />} />
      <StatCard title="Total Context Data" value={formatBytes(stats.totalContextBytes || 0)} icon={<ShieldAlert className="w-6 h-6 text-orange-500" />} />
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="p-6 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-white/5 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{title}</p>
        <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{value}</p>
      </div>
      <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-100 dark:border-white/5">
        {icon}
      </div>
    </div>
  );
}

// ---------------- USERS TAB ---------------- //
function UsersTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchUsers = async () => {
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    if (!data.error) setUsers(data);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const toggleStatus = async (userId: string, currentStatus: boolean) => {
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, updates: { isActive: !currentStatus } })
    });
    fetchUsers();
  };

  const changeTier = async (userId: string, currentTier: string) => {
    const newTier = currentTier === "free" ? "pro" : "free";
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, updates: { tier: newTier } })
    });
    fetchUsers();
  };

  const filtered = users.filter(u => u.email.toLowerCase().includes(searchTerm.toLowerCase()) || (u.fullName && u.fullName.toLowerCase().includes(searchTerm.toLowerCase())));

  if (loading) return <div>Loading users...</div>;

  return (
    <div className="space-y-4">
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
        <input 
          type="text" 
          placeholder="Search users..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-xl"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-white/10 text-zinc-500">
              <th className="pb-3 font-medium">User</th>
              <th className="pb-3 font-medium">Role & Country</th>
              <th className="pb-3 font-medium">Tier</th>
              <th className="pb-3 font-medium">Referral Code</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-white/5">
            {filtered.map(user => (
              <tr key={user.id}>
                <td className="py-4">
                  <div className="font-medium text-zinc-900 dark:text-white">{user.fullName}</div>
                  <div className="text-zinc-500">{user.email}</div>
                  {user.socialUrl && <a href={user.socialUrl} target="_blank" className="text-xs text-violet-500 hover:underline">Social Link</a>}
                </td>
                <td className="py-4 capitalize">
                  <div>{user.userRole?.replace('_', ' ')}</div>
                  <div className="text-zinc-500">{user.country}</div>
                </td>
                <td className="py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${user.tier === 'pro' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-zinc-100 text-zinc-700 dark:bg-white/10 dark:text-zinc-300'}`}>
                    {user.tier.toUpperCase()}
                  </span>
                </td>
                <td className="py-4 font-mono text-xs">{user.referralCode}</td>
                <td className="py-4">
                  {user.isActive ? <span className="text-emerald-500 flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> Active</span> : <span className="text-red-500 flex items-center gap-1"><XCircle className="w-4 h-4"/> Inactive</span>}
                </td>
                <td className="py-4 text-right space-x-2">
                  <button onClick={() => changeTier(user.id, user.tier)} className="px-3 py-1 bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400 rounded-lg text-xs font-medium hover:bg-violet-200 dark:hover:bg-violet-500/30">
                    Toggle Tier
                  </button>
                  <button onClick={() => toggleStatus(user.id, user.isActive)} className="px-3 py-1 bg-zinc-100 text-zinc-700 dark:bg-white/10 dark:text-zinc-300 rounded-lg text-xs font-medium hover:bg-zinc-200 dark:hover:bg-white/20">
                    {user.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------- CONFIG TAB ---------------- //
function ConfigTab() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/config").then(res => res.json()).then(data => {
      setConfig(data);
      setLoading(false);
    });
  }, []);

  const saveConfig = async (key: string, value: any) => {
    await fetch("/api/admin/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value })
    });
    alert("Saved successfully!");
  };

  if (loading) return <div>Loading config...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-white">Tier Limits (JSON)</h3>
        <textarea 
          rows={10}
          className="w-full p-4 font-mono text-sm bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-xl text-zinc-900 dark:text-zinc-300"
          defaultValue={JSON.stringify(config.limits, null, 2)}
          id="tierLimitsInput"
        />
        <button 
          onClick={() => {
            try {
              const val = JSON.parse((document.getElementById("tierLimitsInput") as HTMLTextAreaElement).value);
              saveConfig("TIER_LIMITS", val);
            } catch(e) { alert("Invalid JSON"); }
          }}
          className="mt-4 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium"
        >
          Save Limits
        </button>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-white">Referral Rewards (JSON)</h3>
        <textarea 
          rows={6}
          className="w-full p-4 font-mono text-sm bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-xl text-zinc-900 dark:text-zinc-300"
          defaultValue={JSON.stringify(config.referralRewards, null, 2)}
          id="referralRewardsInput"
        />
        <button 
          onClick={() => {
            try {
              const val = JSON.parse((document.getElementById("referralRewardsInput") as HTMLTextAreaElement).value);
              saveConfig("REFERRAL_REWARDS", val);
            } catch(e) { alert("Invalid JSON"); }
          }}
          className="mt-4 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium"
        >
          Save Referral Rewards
        </button>
      </div>
    </div>
  );
}

// ---------------- PROMOTIONS TAB ---------------- //
function PromotionsTab() {
  const [promos, setPromos] = useState<any[]>([]);
  const [code, setCode] = useState("");
  const [type, setType] = useState("free_pro");

  const fetchPromos = async () => {
    const res = await fetch("/api/admin/promotions");
    const data = await res.json();
    if (!data.error) setPromos(data);
  };

  useEffect(() => { fetchPromos(); }, []);

  const createPromo = async () => {
    if (!code) return;
    await fetch("/api/admin/promotions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, type, value: { durationMonths: 1 } })
    });
    setCode("");
    fetchPromos();
  };

  return (
    <div className="space-y-8">
      <div className="bg-zinc-50 dark:bg-zinc-950 p-6 rounded-xl border border-zinc-200 dark:border-white/10">
        <h3 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-white">Create New Promo</h3>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Code Name</label>
            <input value={code} onChange={e => setCode(e.target.value)} className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl" placeholder="SUMMER2026"/>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Reward Type</label>
            <select value={type} onChange={e => setType(e.target.value)} className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl">
              <option value="free_pro">Free Pro Tier</option>
              <option value="extra_kb">Extra Knowledge Bases</option>
            </select>
          </div>
          <button onClick={createPromo} className="px-6 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold h-[42px]">
            Create
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-white/10 text-zinc-500">
              <th className="pb-3 font-medium">Code</th>
              <th className="pb-3 font-medium">Type</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-white/5">
            {promos.map(promo => (
              <tr key={promo.id}>
                <td className="py-4 font-bold font-mono text-zinc-900 dark:text-white">{promo.code}</td>
                <td className="py-4"><span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-md">{promo.type}</span></td>
                <td className="py-4">{promo.isActive ? <span className="text-emerald-500">Active</span> : <span className="text-red-500">Inactive</span>}</td>
                <td className="py-4 text-zinc-500">{new Date(promo.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {promos.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-zinc-500">No promotions found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
