"use client";

import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell 
} from "recharts";
import { Globe, Clock, MapPin, Activity, CreditCard, TrendingUp, Users } from "lucide-react";

interface AnalyticsProps {
  stats: {
    totalRevenue: number;
    totalCreditsIssued: number;
    totalCreditsConsumed: number;
  };
  revenueByDay: { date: string; amount: number }[];
  creditsByDay: { date: string; issued: number; consumed: number }[];
  topCustomers: any[];
  popularPacks?: any[];
  expensiveOperations?: { operation: string; totalCost: number }[];
  heavyResourceUsers?: { userId: string; name: string; email: string; kbCount: number; dbCount: number; autoCount: number; totalResources: number }[];
}

export default function AnalyticsClient({ stats, revenueByDay, creditsByDay, topCustomers, popularPacks, expensiveOperations, heavyResourceUsers }: AnalyticsProps) {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Platform Analytics</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">AI Credit economy and revenue metrics.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-card border border-zinc-200 dark:border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 text-emerald-600 mb-2">
            <TrendingUp className="w-5 h-5" />
            <h3 className="font-semibold text-sm uppercase tracking-wider">Total Revenue</h3>
          </div>
          <div className="text-4xl font-black text-zinc-900 dark:text-white">
            ${(stats.totalRevenue / 100).toFixed(2)}
          </div>
        </div>
        <div className="bg-white dark:bg-card border border-zinc-200 dark:border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 text-blue-600 mb-2">
            <CreditCard className="w-5 h-5" />
            <h3 className="font-semibold text-sm uppercase tracking-wider">Credits Issued</h3>
          </div>
          <div className="text-4xl font-black text-zinc-900 dark:text-white">
            {stats.totalCreditsIssued.toLocaleString()}
          </div>
        </div>
        <div className="bg-white dark:bg-card border border-zinc-200 dark:border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 text-rose-600 mb-2">
            <Activity className="w-5 h-5" />
            <h3 className="font-semibold text-sm uppercase tracking-wider">Credits Consumed</h3>
          </div>
          <div className="text-4xl font-black text-zinc-900 dark:text-white">
            {stats.totalCreditsConsumed.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Over Time */}
        <div className="p-6 bg-white dark:bg-card border border-zinc-200 dark:border-white/10 rounded-2xl h-96 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <h3 className="text-lg font-medium text-zinc-900 dark:text-white">Revenue (Last 30 Days)</h3>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueByDay} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="date" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value/100}`} />
                <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#ffffff10', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} formatter={(value: any) => [`$${(Number(value)/100).toFixed(2)}`, 'Revenue']} />
                <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" name="Revenue" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Credits Flow */}
        <div className="p-6 bg-white dark:bg-card border border-zinc-200 dark:border-white/10 rounded-2xl h-96 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-medium text-zinc-900 dark:text-white">Credits Issued vs Consumed</h3>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={creditsByDay} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="date" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#ffffff10', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                <Legend />
                <Line type="monotone" dataKey="issued" stroke="#3b82f6" strokeWidth={3} dot={false} name="Issued" />
                <Line type="monotone" dataKey="consumed" stroke="#f43f5e" strokeWidth={3} dot={false} name="Consumed" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Customers */}
        <div className="p-6 bg-white dark:bg-card border border-zinc-200 dark:border-white/10 rounded-2xl flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <Users className="w-5 h-5 text-rose-500" />
            <h3 className="text-lg font-medium text-zinc-900 dark:text-white">Top Customers by Credit Usage</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-50 dark:bg-white/5 border-b border-zinc-200 dark:border-white/10">
                <tr>
                  <th className="px-6 py-3 font-semibold text-zinc-500">Customer</th>
                  <th className="px-6 py-3 font-semibold text-zinc-500 text-right">Consumed</th>
                  <th className="px-6 py-3 font-semibold text-zinc-500 text-right">Issued</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-white/10">
                {topCustomers.map((customer) => (
                  <tr key={customer.userId} className="hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-zinc-900 dark:text-white">{customer.fullName || 'Unknown'}</div>
                      <div className="text-xs text-zinc-500">{customer.email}</div>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-rose-600">{customer.consumed.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-medium text-blue-600">{customer.issued.toLocaleString()}</td>
                  </tr>
                ))}
                {topCustomers.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-zinc-500">No customer data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Popular Packs */}
        <div className="p-6 bg-white dark:bg-card border border-zinc-200 dark:border-white/10 rounded-2xl flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <Globe className="w-5 h-5 text-fuchsia-500" />
            <h3 className="text-lg font-medium text-zinc-900 dark:text-white">Most Popular Credit Packs</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-50 dark:bg-white/5 border-b border-zinc-200 dark:border-white/10">
                <tr>
                  <th className="px-6 py-3 font-semibold text-zinc-500">Pack Size</th>
                  <th className="px-6 py-3 font-semibold text-zinc-500 text-right">Purchases</th>
                  <th className="px-6 py-3 font-semibold text-zinc-500 text-right">Total Credits</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-white/10">
                {popularPacks?.map((pack: any, idx: number) => (
                  <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-zinc-900 dark:text-white">{pack.name}</div>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-zinc-700 dark:text-zinc-300">{pack.count}</td>
                    <td className="px-6 py-4 text-right font-medium text-fuchsia-600">{pack.totalCredits.toLocaleString()}</td>
                  </tr>
                ))}
                {(!popularPacks || popularPacks.length === 0) && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-zinc-500">No purchase data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Most Expensive Operations */}
        <div className="p-6 bg-white dark:bg-card border border-zinc-200 dark:border-white/10 rounded-2xl flex flex-col md:col-span-2">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-rose-500" />
            <h3 className="text-lg font-medium text-zinc-900 dark:text-white">Most Expensive AI Operations</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-50 dark:bg-white/5 border-b border-zinc-200 dark:border-white/10">
                <tr>
                  <th className="px-6 py-3 font-semibold text-zinc-500">Operation Type</th>
                  <th className="px-6 py-3 font-semibold text-zinc-500 text-right">Total AI Credits Consumed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-white/10">
                {expensiveOperations?.map((op: any, idx: number) => (
                  <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium text-zinc-900 dark:text-white capitalize">
                      {op.operation.replace(/_/g, ' ')}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-rose-500">
                      {op.totalCost.toLocaleString()}
                    </td>
                  </tr>
                ))}
                {(!expensiveOperations || expensiveOperations.length === 0) && (
                  <tr>
                    <td colSpan={2} className="px-6 py-8 text-center text-zinc-500">No AI usage data yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Heavy Resource Users */}
        <div className="p-6 bg-white dark:bg-card border border-zinc-200 dark:border-white/10 rounded-2xl flex flex-col md:col-span-2">
          <div className="flex items-center gap-2 mb-6">
            <Globe className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-medium text-zinc-900 dark:text-white">Heavy Resource Users (Platform Resources)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-50 dark:bg-white/5 border-b border-zinc-200 dark:border-white/10">
                <tr>
                  <th className="px-6 py-3 font-semibold text-zinc-500">User</th>
                  <th className="px-6 py-3 font-semibold text-zinc-500 text-right">KBs</th>
                  <th className="px-6 py-3 font-semibold text-zinc-500 text-right">DBs</th>
                  <th className="px-6 py-3 font-semibold text-zinc-500 text-right">Automations</th>
                  <th className="px-6 py-3 font-semibold text-zinc-500 text-right">Total Resources</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-white/10">
                {heavyResourceUsers?.map((user: any, idx: number) => (
                  <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-zinc-900 dark:text-white">{user.name}</div>
                      <div className="text-xs text-zinc-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 text-right text-zinc-700 dark:text-zinc-300">{user.kbCount}</td>
                    <td className="px-6 py-4 text-right text-zinc-700 dark:text-zinc-300">{user.dbCount}</td>
                    <td className="px-6 py-4 text-right text-zinc-700 dark:text-zinc-300">{user.autoCount}</td>
                    <td className="px-6 py-4 text-right font-bold text-blue-600">{user.totalResources}</td>
                  </tr>
                ))}
                {(!heavyResourceUsers || heavyResourceUsers.length === 0) && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">No resource usage data</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
