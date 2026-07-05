"use client";

import Link from "next/link";
import { Search, Filter, MoreHorizontal, Shield, Gift } from "lucide-react";
import { useState } from "react";

export default function UsersClient({ initialUsers }: { initialUsers: any[] }) {
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredUsers = initialUsers.filter(user => {
    if (search && !user.fullName?.toLowerCase().includes(search.toLowerCase()) && !user.email.toLowerCase().includes(search.toLowerCase())) return false;
    if (tierFilter !== "all" && user.tier !== tierFilter) return false;
    if (statusFilter !== "all") {
      if (statusFilter === "active" && !user.isActive) return false;
      if (statusFilter === "inactive" && user.isActive) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Top Users Monitoring</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Monitor high-usage customers and inactive accounts for promotions.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-white dark:bg-card border border-zinc-200 dark:border-white/10 rounded-2xl">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-card border border-zinc-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-2 text-zinc-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none"
          />
        </div>
        <select 
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          className="px-4 py-2 bg-zinc-50 dark:bg-card border border-zinc-200 dark:border-white/10 rounded-xl text-zinc-700 dark:text-zinc-300 outline-none"
        >
          <option value="all">All Tiers</option>
          <option value="free">Free</option>
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Enterprise</option>
        </select>
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-zinc-50 dark:bg-card border border-zinc-200 dark:border-white/10 rounded-xl text-zinc-700 dark:text-zinc-300 outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="bg-white dark:bg-card border border-zinc-200 dark:border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-sm text-zinc-500 dark:text-zinc-400">
          <thead className="text-xs text-zinc-700 dark:text-zinc-300 uppercase bg-zinc-50 dark:bg-white/5 border-b border-zinc-200 dark:border-white/10">
            <tr>
              <th className="px-6 py-4 font-medium">User</th>
              <th className="px-6 py-4 font-medium">Plan</th>
              <th className="px-6 py-4 font-medium">API Usage</th>
              <th className="px-6 py-4 font-medium text-center">Days Inactive</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">No users found</td>
              </tr>
            )}
            {filteredUsers.map(user => (
              <tr key={user.id} className="border-b border-zinc-200 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/5">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center font-bold">
                      {user.fullName?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                        {user.fullName || "Unnamed User"} 
                        {user.isAdmin && <span title="Admin"><Shield className="w-3 h-3 text-rose-500" /></span>}
                      </div>
                      <div className="text-xs text-zinc-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-300 capitalize`}>
                    {user.tier}
                  </span>
                </td>
                <td className="px-6 py-4 font-mono text-zinc-900 dark:text-zinc-300">
                  {user.totalRequests.toLocaleString()} reqs
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`font-bold ${user.daysInactive > 14 ? 'text-rose-500' : 'text-zinc-500'}`}>
                    {user.daysInactive} days
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                    user.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                  }`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  {user.daysInactive > 14 && (
                    <button className="text-violet-500 hover:text-violet-600 font-medium mr-4" title="Send Promotion">
                      <Gift className="w-4 h-4 inline mr-1" /> Promo
                    </button>
                  )}
                  <Link href={`/admin/users/${user.id}`} className="text-rose-500 hover:text-rose-600 font-medium mr-4">View</Link>
                  <button className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"><MoreHorizontal className="w-5 h-5 inline" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
