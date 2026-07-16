"use client";

import { useMockData } from "../../../MockProvider";
import { Users, CreditCard, Activity, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function AdminBillingPage() {
  const { currentPlan, availablePlans } = useMockData();
  const currentPlanDetails = availablePlans.find(p => p.id === currentPlan);

  return (
    <div className="min-h-screen bg-[#030303] text-white flex">
      {/* Sidebar */}
      <div className="w-64 border-r border-white/5 bg-black/50 p-6 flex flex-col">
        <Link href="/" className="flex items-center gap-3 mb-10">
          <img src="/logo.png" className="w-6 h-6 object-contain" alt="BaseParse" />
          <span className="font-bold">Admin Panel</span>
        </Link>
        <div className="flex flex-col gap-2">
          <Link href="/admin/billing" className="px-4 py-2 bg-cyan-500/10 text-cyan-400 font-bold rounded-lg">Billing & Plans</Link>
          <Link href="/admin/tickets" className="px-4 py-2 text-zinc-400 hover:bg-white/5 rounded-lg transition-colors">Support Tickets</Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-10">
        <h1 className="text-3xl font-black mb-8 flex items-center gap-3">
          <CreditCard className="w-8 h-8 text-cyan-400" />
          Revenue & Subscriptions
        </h1>

        <div className="grid grid-cols-3 gap-6 mb-10">
          <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-2xl">
            <h3 className="text-zinc-400 text-sm font-bold mb-2">Monthly Recurring Revenue</h3>
            <div className="text-4xl font-black flex items-end gap-2">
              $14,290 <span className="text-sm text-emerald-400 font-bold flex items-center"><ArrowUpRight className="w-4 h-4" /> 12%</span>
            </div>
          </div>
          <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-2xl">
            <h3 className="text-zinc-400 text-sm font-bold mb-2">Active Subscribers</h3>
            <div className="text-4xl font-black flex items-end gap-2">
              342 <span className="text-sm text-emerald-400 font-bold flex items-center"><ArrowUpRight className="w-4 h-4" /> 5%</span>
            </div>
          </div>
          <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-2xl">
            <h3 className="text-zinc-400 text-sm font-bold mb-2">Your Current Active Plan</h3>
            <div className="text-3xl font-black text-cyan-400 capitalize">
              {currentPlanDetails?.name || "None"}
            </div>
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 bg-black/50">
            <h2 className="font-bold">Recent Transactions</h2>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="text-zinc-500 text-sm border-b border-white/5">
                <th className="px-6 py-3 font-medium">User</th>
                <th className="px-6 py-3 font-medium">Plan</th>
                <th className="px-6 py-3 font-medium">Amount</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { user: "john@startup.io", plan: "Pro Builder", amount: "$49.00", status: "Paid" },
                { user: "sarah@enterprise.co", plan: "Enterprise", amount: "$299.00", status: "Paid" },
                { user: "dev@indie.net", plan: "Pro Builder", amount: "$49.00", status: "Failed" },
                { user: "you@example.com", plan: currentPlanDetails?.name, amount: `$${currentPlanDetails?.price}.00`, status: "Active" },
              ].map((tx, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-medium">{tx.user}</td>
                  <td className="px-6 py-4 text-zinc-300">{tx.plan}</td>
                  <td className="px-6 py-4 font-mono">{tx.amount}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      tx.status === "Paid" || tx.status === "Active" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
