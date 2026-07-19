"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Loader2, UserCircle2, MapPin, Activity, CheckCircle2, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminUsers() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  const fetchUsers = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch("/api/admin/users", {
        headers: { "Authorization": `Bearer ${session.access_token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch users");
      setData(await res.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [supabase]);

  const handleUpgrade = async (userId: string, newPlanId: number) => {
    setUpdatingId(userId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { 
          "Authorization": `Bearer ${session?.access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ userId, newPlanId })
      });
      if (!res.ok) throw new Error("Upgrade failed");
      await fetchUsers(); // Refresh list
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 text-cyan-400 animate-spin" /></div>;
  }
  if (error) {
    return <div className="p-4 bg-red-500/10 text-red-400 border border-red-500/30 rounded font-mono text-sm">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-pixel uppercase tracking-widest text-zinc-800 dark:text-zinc-200 mb-6">User Database</h2>
      
      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#111]">
              <th className="p-4 font-mono text-xs uppercase text-zinc-500">Identity</th>
              <th className="p-4 font-mono text-xs uppercase text-zinc-500">Location</th>
              <th className="p-4 font-mono text-xs uppercase text-zinc-500">Status</th>
              <th className="p-4 font-mono text-xs uppercase text-zinc-500">Current Plan</th>
              <th className="p-4 font-mono text-xs uppercase text-zinc-500 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.users.map((user: any, idx: number) => (
              <motion.tr 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.05 }}
                key={user.id} 
                className="border-b border-zinc-200 dark:border-white/5 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors"
              >
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {user.avatar ? (
                      <img src={user.avatar} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <UserCircle2 className="w-8 h-8 text-zinc-400" />
                    )}
                    <div>
                      <div className="font-medium text-sm text-black dark:text-white">{user.name}</div>
                      <div className="text-xs font-mono text-zinc-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-sm font-mono text-zinc-600 dark:text-zinc-400">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3 h-3" /> {user.country}
                  </div>
                </td>
                <td className="p-4">
                  <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] uppercase tracking-widest font-mono ${user.isOnline ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                    <Activity className="w-3 h-3" /> {user.isOnline ? 'Online' : 'Offline'}
                  </div>
                </td>
                <td className="p-4">
                  <div className="text-sm text-black dark:text-white font-medium">{user.plan.name}</div>
                  <div className="text-xs font-mono text-zinc-500 mt-1">
                    {user.plan.extracted} / {user.plan.limit} limits
                  </div>
                </td>
                <td className="p-4 text-right">
                  <div className="relative inline-block group">
                    <button 
                      disabled={updatingId === user.id}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#014b5c]/10 hover:bg-[#014b5c]/20 dark:bg-cyan-500/10 dark:hover:bg-cyan-500/20 text-[#014b5c] dark:text-cyan-400 rounded text-xs font-mono uppercase tracking-widest transition-colors disabled:opacity-50"
                    >
                      {updatingId === user.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Upgrade"}
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-[#111] border border-zinc-200 dark:border-zinc-800 rounded shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 p-1">
                      {data.availablePlans.map((p: any) => (
                        <button
                          key={p.id}
                          onClick={() => handleUpgrade(user.id, p.id)}
                          className="w-full text-left px-3 py-2 text-sm font-mono text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors flex items-center justify-between"
                        >
                          {p.name}
                          {user.plan.id === p.id && <CheckCircle2 className="w-3 h-3 text-cyan-400" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </td>
              </motion.tr>
            ))}
            {data.users.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-zinc-500 font-mono text-sm">No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
