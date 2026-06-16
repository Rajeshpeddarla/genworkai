"use client";

import React, { useState, useEffect } from 'react';
import { Bot, Plus, Zap, FileText, Database, Code, PlayCircle, X, Activity } from 'lucide-react';

export default function AutomationStudio() {
  const [activeTab, setActiveTab] = useState<'active' | 'templates'>('templates');
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newTask, setNewTask] = useState({ name: '', category: 'Developer', goal: '', sourceId: '' });

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/automation');
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask)
      });
      if (res.ok) {
        await fetchTasks();
        setIsModalOpen(false);
        setNewTask({ name: '', category: 'Developer', goal: '', sourceId: '' });
        setActiveTab('active');
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create task');
      }
    } catch (e) {
      alert('Network error');
    } finally {
      setSaving(false);
    }
  };

  const templates = [
    { category: 'Learning', title: 'Learn Flutter in 90 Days', icon: <Bot className="w-6 h-6 text-blue-500" /> },
    { category: 'Learning', title: 'Certification Preparation', icon: <FileText className="w-6 h-6 text-green-500" /> },
    { category: 'Developer', title: 'Weekly Release Notes', icon: <Code className="w-6 h-6 text-purple-500" /> },
    { category: 'Developer', title: 'API Documentation Refresh', icon: <Zap className="w-6 h-6 text-yellow-500" /> },
    { category: 'Database', title: 'Revenue Monitoring', icon: <Database className="w-6 h-6 text-indigo-500" /> },
    { category: 'Database', title: 'Data Quality Audits', icon: <Database className="w-6 h-6 text-rose-500" /> },
    { category: 'Business', title: 'SOP Generation', icon: <FileText className="w-6 h-6 text-emerald-500" /> },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto w-full h-full text-white bg-[#0a0a0a]">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Automation Studio</h1>
          <p className="text-gray-400 mt-2">Source-driven automation engine for Knowledge Workflows.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Create Task
        </button>
      </div>

      <div className="flex gap-4 mb-8 border-b border-gray-800 pb-2">
        <button 
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2 ${activeTab === 'templates' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400'}`}
        >
          Enterprise Templates
        </button>
        <button 
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 ${activeTab === 'active' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400'}`}
        >
          Active Tasks
        </button>
      </div>

      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((t, i) => (
            <div key={i} className="bg-[#111] border border-gray-800 p-6 rounded-xl hover:border-indigo-500/50 transition-colors cursor-pointer group">
              <div className="bg-gray-900/50 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                {t.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{t.title}</h3>
              <p className="text-gray-400 text-sm mb-4">Category: {t.category}</p>
              <button className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm font-medium">
                <PlayCircle className="w-4 h-4" /> Use Template
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'active' && (
        loading ? (
          <div className="flex justify-center py-20"><Activity className="w-8 h-8 text-indigo-500 animate-spin" /></div>
        ) : tasks.length === 0 ? (
          <div className="bg-[#111] border border-gray-800 rounded-xl p-8 text-center">
            <Bot className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Active Tasks</h2>
            <p className="text-gray-400">Select a template or create a custom task to automate your workflows.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map(task => (
              <div key={task.id} className="bg-[#111] border border-gray-800 p-6 rounded-xl flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold">{task.name}</h3>
                  <p className="text-gray-400 text-sm mt-1">Category: <span className="capitalize">{task.type}</span> | Status: <span className="text-green-400 capitalize">{task.isActive ? 'Active' : 'Inactive'}</span></p>
                </div>
                <button className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm text-white">
                  View Logs
                </button>
              </div>
            ))}
          </div>
        )
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111] border border-gray-800 rounded-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Create Automation Task</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Task Name</label>
                <input required type="text" value={newTask.name} onChange={e => setNewTask({...newTask, name: e.target.value})} className="w-full bg-[#0a0a0a] border border-gray-800 rounded-lg px-3 py-2 text-white" placeholder="Daily Report" />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">Category</label>
                <select value={newTask.category} onChange={e => setNewTask({...newTask, category: e.target.value})} className="w-full bg-[#0a0a0a] border border-gray-800 rounded-lg px-3 py-2 text-white">
                  <option value="Developer">Developer</option>
                  <option value="Database">Database</option>
                  <option value="Learning">Learning</option>
                  <option value="Business">Business</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Goal (Prompt)</label>
                <textarea required rows={3} value={newTask.goal} onChange={e => setNewTask({...newTask, goal: e.target.value})} className="w-full bg-[#0a0a0a] border border-gray-800 rounded-lg px-3 py-2 text-white" placeholder="What should this task accomplish?"></textarea>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Source ID (Optional)</label>
                <input type="number" value={newTask.sourceId} onChange={e => setNewTask({...newTask, sourceId: e.target.value})} className="w-full bg-[#0a0a0a] border border-gray-800 rounded-lg px-3 py-2 text-white" placeholder="e.g. 1" />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50 flex justify-center items-center gap-2">
                  {saving && <Activity className="w-4 h-4 animate-spin" />}
                  {saving ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
