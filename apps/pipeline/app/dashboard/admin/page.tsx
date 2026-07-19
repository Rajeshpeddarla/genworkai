"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Loader2, Users, FileText, Activity } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminOverview() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  useEffect(() => {
    async function fetchStats() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const res = await fetch("/api/admin/stats", {
          headers: {
            "Authorization": `Bearer ${session.access_token}`
          }
        });

        if (!res.ok) {
          throw new Error("Failed to fetch stats");
        }

        const data = await res.json();
        setStats(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[30vh]">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border border-red-500/30 bg-red-500/10 text-red-400 font-mono text-sm rounded-lg">
        [ERROR] {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="p-6 border border-zinc-200 dark:border-white/10 rounded-xl bg-zinc-50 dark:bg-[#0a0a0a]"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-mono text-sm uppercase tracking-widest text-zinc-500">Total Users</h3>
          </div>
          <p className="text-4xl font-pixel text-[#014b5c] dark:text-cyan-400">{stats.totalUsers}</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="p-6 border border-zinc-200 dark:border-white/10 rounded-xl bg-zinc-50 dark:bg-[#0a0a0a]"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-mono text-sm uppercase tracking-widest text-zinc-500">Total Documents</h3>
          </div>
          <p className="text-4xl font-pixel text-[#014b5c] dark:text-cyan-400">{stats.totalRequests}</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="p-6 border border-zinc-200 dark:border-white/10 rounded-xl bg-zinc-50 dark:bg-[#0a0a0a]"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 rounded-lg">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="font-mono text-sm uppercase tracking-widest text-zinc-500">Active Subscriptions</h3>
          </div>
          <div className="space-y-2 mt-4">
            {stats.subscriptions.map((sub: any, idx: number) => (
              <div key={idx} className="flex justify-between text-sm font-mono">
                <span className="text-zinc-500">{sub.name || "Unknown"}</span>
                <span className="text-black dark:text-white">{sub.count}</span>
              </div>
            ))}
            {stats.subscriptions.length === 0 && (
              <p className="text-sm font-mono text-zinc-500">No active subscriptions</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
