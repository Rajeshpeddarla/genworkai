"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Code, Loader2, Database, Settings, Clock4, Bot } from 'lucide-react';

export function CreateEditDrawer({ isOpen, onClose, taskId, databases, onSaved }: any) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingSql, setIsGeneratingSql] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    systemPrompt: '',
    sqlQuery: '',
    databaseId: '',
    schedule: 'manual',
    status: 'draft',
    queryMode: 'manual'
  });

  useEffect(() => {
    if (isOpen) {
      if (taskId) {
        fetchTask();
      } else {
        setFormData({
          name: '',
          description: '',
          systemPrompt: '',
          sqlQuery: '',
          databaseId: '',
          schedule: 'manual',
          status: 'draft',
          queryMode: 'manual'
        });
      }
    }
  }, [isOpen, taskId]);

  const fetchTask = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/automation/database');
      if (res.ok) {
        const data = await res.json();
        const a = data.tasks?.find((t: any) => t.id === taskId);
        if (a) {
          setFormData({
            name: a.name || '',
            description: a.description || '',
            systemPrompt: a.goal || '',
            sqlQuery: a.sqlQuery || '',
            databaseId: a.sources?.[0]?.id?.toString() || '',
            schedule: a.schedule || 'manual',
            status: a.status || 'draft',
            queryMode: 'manual'
          });
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        goal: formData.systemPrompt,
        sqlQuery: formData.sqlQuery,
        sources: formData.databaseId ? [{ type: 'database', id: parseInt(formData.databaseId) }] : [],
        schedule: formData.schedule,
        status: formData.status
      };

      const url = taskId ? `/api/automation/database/${taskId}` : `/api/automation/database`;
      const method = taskId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        onSaved();
        onClose();
      } else {
        const error = await res.text();
        alert('Failed to save: ' + error);
      }
    } catch (e) {
      console.error(e);
      alert('Error saving automation');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateSql = async () => {
    if (!formData.databaseId || !aiPrompt) return;
    setIsGeneratingSql(true);
    try {
      const res = await fetch('/api/automation/database/generate-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt, databaseId: formData.databaseId })
      });
      const data = await res.json();
      if (res.ok) {
        setFormData(prev => ({ ...prev, sqlQuery: data.sql }));
      } else {
        alert('Failed to generate SQL: ' + data.error);
      }
    } catch (e) {
      console.error(e);
      alert('Error generating SQL');
    } finally {
      setIsGeneratingSql(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
          <motion.div 
            initial={{ x: '100%' }} 
            animate={{ x: 0 }} 
            exit={{ x: '100%' }} 
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-[45%] min-w-[500px] bg-[#0f0f0f] border-l border-zinc-200 dark:border-zinc-800 z-50 flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{taskId ? 'Edit Automation' : 'Create Automation'}</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-500 dark:text-zinc-400 mt-1">Configure your database automation</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-gray-800 rounded-lg text-zinc-500 dark:text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar text-zinc-900 dark:text-white">
              {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
              ) : (
                <>
                  {/* General */}
                  <section className="space-y-4">
                    <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                      <Settings className="w-4 h-4" /> General
                    </h3>
                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-zinc-600 dark:text-zinc-600 dark:text-zinc-300">Automation Name</label>
                      <input 
                        value={formData.name}
                        onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full bg-black/5 dark:bg-white/5 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 focus:border-indigo-500 focus:outline-none transition-colors"
                        placeholder="e.g. Daily Signups Report"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-zinc-600 dark:text-zinc-600 dark:text-zinc-300">Description</label>
                      <input 
                        value={formData.description}
                        onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full bg-black/5 dark:bg-white/5 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 focus:border-indigo-500 focus:outline-none transition-colors"
                        placeholder="Briefly describe what this automation does"
                      />
                    </div>
                  </section>

                  {/* Database */}
                  <section className="space-y-4">
                    <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                      <Database className="w-4 h-4" /> Database Configuration
                    </h3>
                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-zinc-600 dark:text-zinc-600 dark:text-zinc-300">Connection</label>
                      <select 
                        value={formData.databaseId}
                        onChange={e => setFormData(prev => ({ ...prev, databaseId: e.target.value }))}
                        className="w-full bg-black/5 dark:bg-white/5 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 focus:border-indigo-500 focus:outline-none transition-colors"
                      >
                        <option value="">Select a database...</option>
                        {databases.filter((db: any) => db.engine === 'pg' || db.engine === 'mysql').map((db: any) => (
                          <option key={db.id} value={db.id}>{db.name} ({db.engine})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-zinc-600 dark:text-zinc-600 dark:text-zinc-300">Query Generation Mode</label>
                      <div className="flex bg-black/5 dark:bg-white/5 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1">
                        <button 
                          onClick={() => setFormData(prev => ({ ...prev, queryMode: 'manual' }))}
                          className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors ${formData.queryMode === 'manual' ? 'bg-[#2a2a2a] text-zinc-900 dark:text-white shadow' : 'text-zinc-500 dark:text-zinc-500 dark:text-zinc-400 hover:text-zinc-600 dark:text-zinc-600 dark:text-zinc-300'}`}
                        >
                          Manual SQL
                        </button>
                        <button 
                          onClick={() => setFormData(prev => ({ ...prev, queryMode: 'ai' }))}
                          className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors ${formData.queryMode === 'ai' ? 'bg-[#2a2a2a] text-zinc-900 dark:text-white shadow' : 'text-zinc-500 dark:text-zinc-500 dark:text-zinc-400 hover:text-zinc-600 dark:text-zinc-600 dark:text-zinc-300'}`}
                        >
                          Generate with AI
                        </button>
                      </div>
                    </div>

                    <AnimatePresence mode="popLayout">
                      {formData.queryMode === 'ai' && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-indigo-900/10 border border-indigo-500/20 rounded-xl p-4 space-y-3 overflow-hidden"
                        >
                          <label className="block text-sm font-medium text-indigo-300">What data do you want to query?</label>
                          <textarea 
                            value={aiPrompt}
                            onChange={e => setAiPrompt(e.target.value)}
                            className="w-full bg-[#0a0a0a] border border-indigo-500/30 rounded-lg px-3 py-2 text-zinc-900 dark:text-white focus:border-indigo-400 focus:outline-none text-sm resize-y min-h-[80px]"
                            placeholder="e.g. Find all users who signed up in the last 30 days and spent more than $100..."
                          />
                          <button
                            onClick={handleGenerateSql}
                            disabled={isGeneratingSql || !aiPrompt || !formData.databaseId}
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                          >
                            {isGeneratingSql ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
                            {!formData.databaseId ? "Select a Database Connection First" : "Generate SQL"}
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-zinc-600 dark:text-zinc-600 dark:text-zinc-300">SQL Query</label>
                      <div className="bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden focus-within:border-indigo-500 transition-colors">
                        <textarea 
                          value={formData.sqlQuery}
                          onChange={e => setFormData(prev => ({ ...prev, sqlQuery: e.target.value }))}
                          className="w-full bg-transparent p-4 text-green-400 font-mono text-sm focus:outline-none min-h-[150px] resize-y"
                          placeholder="SELECT * FROM table_name;"
                        />
                        <div className="bg-white dark:bg-[#111] px-4 py-2 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center text-xs text-gray-500">
                          <span>Only read-only queries are permitted.</span>
                          <button className="text-indigo-400 hover:text-indigo-300 font-medium">Test Query</button>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* AI Analysis */}
                  <section className="space-y-4">
                    <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                      <Code className="w-4 h-4" /> AI Analysis
                    </h3>
                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-zinc-600 dark:text-zinc-600 dark:text-zinc-300">System Prompt</label>
                      <textarea 
                        value={formData.systemPrompt}
                        onChange={e => setFormData(prev => ({ ...prev, systemPrompt: e.target.value }))}
                        className="w-full bg-black/5 dark:bg-white/5 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 focus:border-indigo-500 focus:outline-none min-h-[120px] resize-y"
                        placeholder="Instructions for the AI on how to interpret the data..."
                      />
                    </div>
                  </section>

                  {/* Scheduling */}
                  <section className="space-y-4">
                    <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                      <Clock4 className="w-4 h-4" /> Scheduling
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1.5 text-zinc-600 dark:text-zinc-600 dark:text-zinc-300">Frequency</label>
                        <select 
                          value={formData.schedule}
                          onChange={e => setFormData(prev => ({ ...prev, schedule: e.target.value }))}
                          className="w-full bg-black/5 dark:bg-white/5 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 focus:border-indigo-500 focus:outline-none"
                        >
                          <option value="manual">Manual (Run Now)</option>
                          <option value="hourly">Hourly</option>
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1.5 text-zinc-600 dark:text-zinc-600 dark:text-zinc-300">Initial Status</label>
                        <select 
                          value={formData.status}
                          onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}
                          className="w-full bg-black/5 dark:bg-white/5 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 focus:border-indigo-500 focus:outline-none"
                        >
                          <option value="draft">Draft</option>
                          <option value="active">Active</option>
                          <option value="paused">Paused</option>
                        </select>
                      </div>
                    </div>
                  </section>
                </>
              )}
            </div>

            <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 bg-[#0a0a0a] flex justify-end gap-3">
              <button 
                onClick={onClose}
                className="px-6 py-2.5 text-zinc-600 dark:text-zinc-600 dark:text-zinc-300 font-medium hover:text-zinc-900 dark:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={saving || loading}
                className="flex items-center gap-2 px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} 
                {taskId ? 'Save Changes' : 'Create Automation'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
