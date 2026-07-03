"use client";

import React, { useState, useEffect } from 'react';
import { Plus, RefreshCcw, Database, Play, Pause, FileText, Activity, Clock, CheckCircle, AlertCircle, PlayCircle, Clock4, Check, X, Search, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreateEditDrawer } from './CreateEditDrawer';
import { DetailsDrawer } from './DetailsDrawer';

export function AutomationDashboard() {
  const [automations, setAutomations] = useState<any[]>([]);
  const [databases, setDatabases] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterEngine, setFilterEngine] = useState<string>('all');
  
  const [isCreateEditOpen, setIsCreateEditOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [autoRes, dbRes, statsRes] = await Promise.all([
        fetch('/api/automation/database'),
        fetch('/api/databases'),
        fetch('/api/automation/database/stats')
      ]);
      
      if (autoRes.ok) {
        const data = await autoRes.json();
        setAutomations(data.tasks || []);
      }
      if (dbRes.ok) {
        const data = await dbRes.json();
        setDatabases(Array.isArray(data) ? data : data.databases || []);
      }
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRunNow = async (e: React.MouseEvent, taskId: number) => {
    e.stopPropagation();
    try {
      setAutomations(prev => prev.map(t => t.id === taskId ? { ...t, status: 'running' } : t));
      const res = await fetch(`/api/automation/database/${taskId}/run`, { method: 'POST' });
      if (!res.ok) {
        const text = await res.text();
        alert('Failed to run: ' + text);
      }
      await fetchData(); // refresh after run
    } catch (e) {
      console.error(e);
    }
  };

  const handleTogglePause = async (e: React.MouseEvent, taskId: number, currentStatus: string) => {
    e.stopPropagation();
    const newStatus = currentStatus === 'paused' ? 'active' : 'paused';
    try {
      setAutomations(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      const res = await fetch(`/api/automation/database/${taskId}/pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Failed to toggle status');
      await fetchData();
    } catch (e) {
      console.error(e);
      setAutomations(prev => prev.map(t => t.id === taskId ? { ...t, status: currentStatus } : t));
    }
  };

  const handleDelete = async (e: React.MouseEvent, taskId: number) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this automation?')) return;
    try {
      const res = await fetch(`/api/automation/database/${taskId}`, { method: 'DELETE' });
      if (res.ok) {
        setAutomations(prev => prev.filter(t => t.id !== taskId));
        fetchData();
      } else {
        alert('Failed to delete');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openCreate = () => {
    setSelectedId(null);
    setIsCreateEditOpen(true);
  };

  const openEdit = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setSelectedId(id);
    setIsCreateEditOpen(true);
  };

  const openDetails = (id: number) => {
    setSelectedId(id);
    setIsDetailsOpen(true);
  };

  const filteredAutomations = automations.filter(a => {
    const matchesSearch = (a.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (a.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || a.status === filterStatus;
    
    let matchesEngine = true;
    if (filterEngine !== 'all') {
      const db = databases.find(d => d.id.toString() === a.sources?.[0]?.id?.toString());
      matchesEngine = db?.engine === filterEngine;
    }
    
    return matchesSearch && matchesStatus && matchesEngine;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Automation Dashboard</h1>
          <p className="text-gray-400 mt-1">Monitor, manage, and create database automations</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchData} 
            className="p-2.5 bg-[#111] hover:bg-gray-800 border border-gray-800 rounded-xl transition-colors"
          >
            <RefreshCcw className={`w-5 h-5 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={openCreate}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-indigo-900/20"
          >
            <Plus className="w-5 h-5" /> Create Automation
          </button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard title="Total Automations" value={stats?.total || 0} icon={<Database className="w-4 h-4 text-indigo-400" />} />
        <StatCard title="Active" value={stats?.active || 0} icon={<Activity className="w-4 h-4 text-green-400" />} />
        <StatCard title="Running" value={stats?.running || 0} icon={<PlayCircle className="w-4 h-4 text-blue-400 animate-pulse" />} />
        <StatCard title="Paused" value={stats?.paused || 0} icon={<Pause className="w-4 h-4 text-amber-400" />} />
        <StatCard title="Failed" value={stats?.failed || 0} icon={<AlertCircle className="w-4 h-4 text-red-400" />} />
        <StatCard title="Total Executions" value={stats?.totalExecutions || 0} icon={<CheckCircle className="w-4 h-4 text-emerald-400" />} />
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input 
            type="text" 
            placeholder="Search automations..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#111] border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-white focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div className="flex gap-2">
          <select 
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-[#111] border border-gray-800 rounded-xl px-4 py-2.5 text-white focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="running">Running</option>
            <option value="failed">Failed</option>
            <option value="draft">Draft</option>
          </select>
          <select 
            value={filterEngine}
            onChange={e => setFilterEngine(e.target.value)}
            className="bg-[#111] border border-gray-800 rounded-xl px-4 py-2.5 text-white focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">All Databases</option>
            <option value="pg">PostgreSQL</option>
            <option value="mysql">MySQL</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {filteredAutomations.length === 0 ? (
        <div className="bg-[#111] border border-gray-800 rounded-2xl p-12 flex flex-col items-center justify-center text-center mt-4">
          <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6">
            <Database className="w-10 h-10 text-indigo-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">No automations found</h2>
          <p className="text-gray-400 max-w-md mb-8">Create your first database automation to schedule queries, generate AI reports, and monitor your data automatically.</p>
          <button 
            onClick={openCreate}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-indigo-900/20"
          >
            <Plus className="w-5 h-5" /> Create Your First Automation
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence>
            {filteredAutomations.map(a => {
              const db = databases.find(d => d.id.toString() === a.sources?.[0]?.id?.toString());
              const isRunning = a.status === 'running';
              
              return (
                <motion.div 
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={a.id}
                  onClick={() => openDetails(a.id)}
                  className="bg-[#111] border border-gray-800 rounded-2xl overflow-hidden hover:border-gray-700 hover:shadow-xl hover:shadow-black/50 transition-all cursor-pointer group flex flex-col"
                >
                  <div className="p-5 border-b border-gray-800/50">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold text-lg text-white truncate pr-2">{a.name}</h3>
                      <StatusBadge status={a.status} />
                    </div>
                    <p className="text-gray-400 text-sm line-clamp-2 min-h-[40px]">{a.description || 'No description provided.'}</p>
                  </div>
                  
                  <div className="p-5 bg-[#151515] flex-1 flex flex-col gap-3 text-sm">
                    <div className="flex justify-between items-center text-gray-400">
                      <span className="flex items-center gap-1.5"><Database className="w-3.5 h-3.5" /> Database</span>
                      <span className="text-white font-medium truncate max-w-[120px]">{db?.name || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between items-center text-gray-400">
                      <span className="flex items-center gap-1.5"><Clock4 className="w-3.5 h-3.5" /> Schedule</span>
                      <span className="text-white font-medium capitalize">{a.schedule || 'Manual'}</span>
                    </div>
                    <div className="flex justify-between items-center text-gray-400">
                      <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> Total Runs</span>
                      <span className="text-white font-medium">{a.totalRuns || 0}</span>
                    </div>
                  </div>
                  
                  <div className="p-4 border-t border-gray-800/50 flex items-center justify-between bg-[#111]">
                    <div className="flex gap-2">
                      <button 
                        onClick={(e) => handleRunNow(e, a.id)}
                        disabled={isRunning}
                        className={`p-2 rounded-lg transition-colors ${isRunning ? 'bg-blue-500/10 text-blue-400' : 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20'}`}
                        title="Run Now"
                      >
                        {isRunning ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                      </button>
                      <button 
                        onClick={(e) => handleTogglePause(e, a.id, a.status)}
                        className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                        title={a.status === 'paused' ? 'Resume' : 'Pause'}
                      >
                        {a.status === 'paused' ? <PlayCircle className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                      </button>
                    </div>
                    
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => openEdit(e, a.id)}
                        className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors text-xs font-medium"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={(e) => handleDelete(e, a.id)}
                        className="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors text-xs font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Drawers */}
      <CreateEditDrawer 
        isOpen={isCreateEditOpen} 
        onClose={() => setIsCreateEditOpen(false)} 
        taskId={selectedId} 
        databases={databases}
        onSaved={fetchData}
      />

      <DetailsDrawer 
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        taskId={selectedId}
        automations={automations}
        databases={databases}
        onEdit={(id: number) => {
          setIsDetailsOpen(false);
          openEdit({ stopPropagation: () => {} } as any, id);
        }}
      />
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) {
  return (
    <div className="bg-[#111] border border-gray-800 rounded-xl p-4 flex flex-col justify-between hover:border-gray-700 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <span className="text-gray-400 text-sm font-medium">{title}</span>
        {icon}
      </div>
      <span className="text-2xl font-bold text-white">{value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  let color = 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  if (status === 'active') color = 'bg-green-500/10 text-green-400 border-green-500/20';
  if (status === 'paused') color = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  if (status === 'running') color = 'bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse';
  if (status === 'failed') color = 'bg-red-500/10 text-red-400 border-red-500/20';
  
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${color} capitalize flex items-center gap-1.5`}>
      {status === 'running' && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />}
      {status}
    </span>
  );
}
