"use client";

import { useState, useEffect } from "react";
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell 
} from "recharts";
import { Globe, Clock, MapPin, Activity } from "lucide-react";

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock analytics data
    setTimeout(() => {
      setData({
        countryData: [
          { name: 'United States', users: 840 }, { name: 'United Kingdom', users: 320 },
          { name: 'India', users: 290 }, { name: 'Canada', users: 150 },
          { name: 'Australia', users: 110 }, { name: 'Germany', users: 95 }
        ],
        cityData: [
          { name: 'New York', users: 180 }, { name: 'London', users: 140 },
          { name: 'San Francisco', users: 120 }, { name: 'Bangalore', users: 110 },
          { name: 'Toronto', users: 90 }, { name: 'Sydney', users: 65 }
        ],
        usageByHour: [
          { hour: '12am', active: 120 }, { hour: '3am', active: 80 },
          { hour: '6am', active: 250 }, { hour: '9am', active: 850 },
          { hour: '12pm', active: 1100 }, { hour: '3pm', active: 980 },
          { hour: '6pm', active: 640 }, { hour: '9pm', active: 320 }
        ],
        activityTypes: [
          { name: 'LLM Chat', value: 45 }, { name: 'Database Queries', value: 25 },
          { name: 'Automations', value: 20 }, { name: 'MCP Calls', value: 10 }
        ]
      });
      setLoading(false);
    }, 500);
  }, []);

  if (loading) return <div className="animate-pulse h-96 bg-zinc-900 rounded-xl"></div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Platform Analytics</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Geographic distribution and usage patterns.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Country Distribution */}
        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl h-96 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <Globe className="w-5 h-5 text-emerald-500" />
            <h3 className="text-lg font-medium text-zinc-900 dark:text-white">Registrations by Country</h3>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.countryData} layout="vertical" margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                <XAxis type="number" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} width={100} />
                <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#ffffff10', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} cursor={{fill: '#ffffff05'}} />
                <Bar dataKey="users" fill="#10b981" radius={[0, 4, 4, 0]} barSize={24} name="Total Users" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* City Distribution */}
        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl h-96 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <MapPin className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-medium text-zinc-900 dark:text-white">Top Cities</h3>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.cityData} layout="vertical" margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                <XAxis type="number" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} width={100} />
                <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#ffffff10', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} cursor={{fill: '#ffffff05'}} />
                <Bar dataKey="users" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24} name="Total Users" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Usage by Hour */}
        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl h-96 flex flex-col lg:col-span-2">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="w-5 h-5 text-rose-500" />
            <h3 className="text-lg font-medium text-zinc-900 dark:text-white">Active Users by Hour (24h)</h3>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.usageByHour} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="hour" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#ffffff10', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                <Area type="monotone" dataKey="active" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorActive)" name="Active Sessions" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
