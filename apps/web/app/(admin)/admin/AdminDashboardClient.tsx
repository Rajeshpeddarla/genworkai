"use client";

import { useState } from "react";
import { 
  Users, Database, LayoutDashboard, Zap, Network, CreditCard, 
  Activity, Ticket, FileText, Server, AlertCircle, CheckCircle2
} from "lucide-react";
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";

export default function AdminDashboardClient({ stats }: { stats: any }) {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Enterprise Overview</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Platform analytics, system health, and cost monitoring.</p>
        </div>
      </div>

      <div className="flex space-x-1 p-1 bg-white dark:bg-card border border-zinc-200 dark:border-white/10 rounded-xl w-fit">
        {["overview", "usage_cost", "health"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-lg capitalize transition-all ${
              activeTab === tab
                ? "bg-rose-600 text-white shadow-md"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            {tab.replace('_', ' & ')}
          </button>
        ))}
      </div>

      {activeTab === "overview" && <EnterpriseOverviewTab stats={stats} />}
      {activeTab === "usage_cost" && <UsageCostTab stats={stats} />}
      {activeTab === "health" && <SystemHealthTab stats={stats} />}
    </div>
  );
}

function EnterpriseOverviewTab({ stats }: { stats: any }) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Users" value={stats.totalUsers} trend="+12% this month" icon={<Users className="w-5 h-5 text-blue-500" />} />
        <StatCard title="Active Users (Today)" value={stats.activeUsersToday} icon={<Activity className="w-5 h-5 text-emerald-500" />} />
        <StatCard title="Total Revenue" value={`$${(stats.revenue/1000).toFixed(1)}k`} trend="+5% this month" icon={<CreditCard className="w-5 h-5 text-rose-500" />} />
        <StatCard title="New Signups (7d)" value={stats.newSignups} icon={<Users className="w-5 h-5 text-violet-500" />} />
        
        <StatCard title="Knowledge Bases" value={stats.totalKbs} icon={<Database className="w-5 h-5 text-fuchsia-500" />} />
        <StatCard title="DB Connections" value={stats.totalDbs} icon={<Server className="w-5 h-5 text-orange-500" />} />
        <StatCard title="Total Automations" value={stats.totalAutomations} icon={<Zap className="w-5 h-5 text-yellow-500" />} />
        <StatCard title="Total Artifacts" value={stats.totalArtifacts} icon={<FileText className="w-5 h-5 text-cyan-500" />} />
        
        <StatCard title="Total API Requests" value={stats.totalApiRequests.toLocaleString()} icon={<Network className="w-5 h-5 text-blue-400" />} />
        <StatCard title="Total MCP Requests" value={stats.totalMcpRequests.toLocaleString()} icon={<LayoutDashboard className="w-5 h-5 text-emerald-400" />} />
        <StatCard title="Open Tickets" value={stats.openTickets} icon={<Ticket className="w-5 h-5 text-red-500" />} />
      </div>

      {/* Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 bg-white dark:bg-card border border-zinc-200 dark:border-white/10 rounded-2xl h-96 flex flex-col">
          <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-6">User Growth (Last 7 Days)</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.userGrowthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#ffffff10', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                <Area type="monotone" dataKey="users" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-card border border-zinc-200 dark:border-white/10 rounded-2xl h-96 flex flex-col">
          <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-6">Subscription Distribution</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.subscriptionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {stats.subscriptionData?.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={['#10b981', '#3b82f6', '#8b5cf6', '#f43f5e', '#f59e0b'][index % 5]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#ffffff10', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-card border border-zinc-200 dark:border-white/10 rounded-2xl h-96 flex flex-col">
          <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-6">API & Token Usage Trends</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.apiTrendsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#ffffff10', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Bar dataKey="tokens" stackId="a" fill="#8b5cf6" radius={[0, 0, 4, 4]} name="Tokens (M)" />
                <Bar dataKey="apiCalls" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} name="API Calls (K)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-card border border-zinc-200 dark:border-white/10 rounded-2xl h-96 flex flex-col">
          <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-6">Top Countries</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.countryData} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                <XAxis type="number" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} width={80} />
                <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#ffffff10', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} cursor={{fill: '#ffffff05'}} />
                <Bar dataKey="users" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function UsageCostTab({ stats }: { stats: any }) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Daily Token Usage" value="12.5M" icon={<Activity className="w-5 h-5 text-rose-500" />} />
        <StatCard title="Monthly Token Usage" value="345.2M" icon={<Activity className="w-5 h-5 text-violet-500" />} />
        <StatCard title="Estimated LLM Cost" value="$1,240.50" icon={<CreditCard className="w-5 h-5 text-emerald-500" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopListCard title="Top Users by Usage" items={["Acme Corp - 45M tokens", "Stark Ind - 32M tokens", "Wayne Ent - 28M tokens"]} />
        <TopListCard title="Top API Consumers" items={["api_key_89xx - 1.2M reqs", "api_key_42xx - 900K reqs", "api_key_11xx - 450K reqs"]} />
        <TopListCard title="Top Knowledge Bases" items={["Engineering Docs - 5.2GB", "Customer Support - 3.1GB", "HR Policies - 1.2GB"]} />
        <TopListCard title="Top DB Connections" items={["Prod-DB-1 (Postgres)", "Analytics-DB (Snowflake)", "Staging-DB (MySQL)"]} />
      </div>
    </div>
  );
}

function SystemHealthTab({ stats }: { stats: any }) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <HealthCard name="Supabase DB" status="Operational" latency="24ms" />
        <HealthCard name="Redis Cache" status="Operational" latency="5ms" />
        <HealthCard name="Inngest Workers" status="Operational" latency="45ms" />
        <HealthCard name="API Gateway" status="Operational" latency="120ms avg" />
        <HealthCard name="MCP Proxies" status="Degraded" latency="450ms avg" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-white dark:bg-card border border-zinc-200 dark:border-white/10 rounded-2xl">
          <h3 className="text-lg font-medium text-white mb-4">Queue Health</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Pending Jobs</span>
              <span className="text-white font-bold">142</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Processing</span>
              <span className="text-white font-bold">24</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Failed (24h)</span>
              <span className="text-rose-500 font-bold">3</span>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-card border border-zinc-200 dark:border-white/10 rounded-2xl">
          <h3 className="text-lg font-medium text-white mb-4">MCP Request Volume</h3>
          <div className="h-40 flex items-center justify-center border border-white/5 rounded-xl">
            <span className="text-zinc-500">Volume Chart</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend }: { title: string; value: string | number; icon: React.ReactNode, trend?: string }) {
  return (
    <div className="p-6 bg-white dark:bg-card rounded-2xl border border-zinc-200 dark:border-white/10 shadow-sm flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{title}</p>
        <div className="p-2 bg-zinc-50 dark:bg-white/5 rounded-lg">
          {icon}
        </div>
      </div>
      <div>
        <p className="text-3xl font-bold text-zinc-900 dark:text-white">{value}</p>
        {trend && <p className="text-xs text-emerald-500 mt-2">{trend}</p>}
      </div>
    </div>
  );
}

function HealthCard({ name, status, latency }: { name: string, status: string, latency: string }) {
  const isOk = status === "Operational";
  return (
    <div className="p-6 bg-white dark:bg-card rounded-2xl border border-zinc-200 dark:border-white/10 shadow-sm flex items-center gap-4">
      {isOk ? <CheckCircle2 className="w-8 h-8 text-emerald-500" /> : <AlertCircle className="w-8 h-8 text-rose-500" />}
      <div className="flex-1">
        <h4 className="text-white font-medium">{name}</h4>
        <div className="flex gap-4 mt-1 text-sm">
          <span className={isOk ? "text-emerald-500" : "text-rose-500"}>{status}</span>
          <span className="text-zinc-500">{latency}</span>
        </div>
      </div>
    </div>
  );
}

function TopListCard({ title, items }: { title: string, items: string[] }) {
  return (
    <div className="p-6 bg-white dark:bg-card border border-zinc-200 dark:border-white/10 rounded-2xl">
      <h3 className="text-lg font-medium text-white mb-4">{title}</h3>
      <ul className="space-y-3">
        {items.map((item, i) => (
          <li key={i} className="flex gap-3 items-center text-sm">
            <span className="w-6 h-6 rounded bg-white/5 flex items-center justify-center text-zinc-500 text-xs">{i+1}</span>
            <span className="text-zinc-300">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
