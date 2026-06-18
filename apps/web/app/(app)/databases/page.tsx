"use client";

import React, { useState, useEffect } from 'react';
import { Database, Plus, Search, Server, Shield, Activity, FileText, X, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function DatabasesDashboard() {
  const [databases, setDatabases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDb, setNewDb] = useState({ name: '', engine: 'pg', host: '', port: '', database: '', username: '', password: '' });
  const [saving, setSaving] = useState(false);

  const fetchDatabases = async () => {
    try {
      const res = await fetch('/api/databases'); // Fetch all databases for MVP
      if (res.ok) {
        const data = await res.json();
        setDatabases(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabases();
  }, []);

  const handleAddDatabase = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const res = await fetch('/api/knowledge/sources/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newDb, kbId: 1 }) // Hardcode kbId 1 for MVP
      });

      if (res.ok) {
        await fetchDatabases();
        setIsModalOpen(false);
        setNewDb({ name: '', engine: 'pg', host: '', port: '', database: '', username: '', password: '' });
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to connect to database');
      }
    } catch (error) {
      alert('Network error connecting to database');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full h-full text-white bg-[#0a0a0a]">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Database className="w-8 h-8 text-indigo-500" />
            Database Intelligence
          </h1>
          <p className="text-gray-400 mt-2">Connect, analyze, and automate database knowledge.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Database Source
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Activity className="w-8 h-8 text-indigo-500 animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {databases.map((db) => (
            <div key={db.id} className="bg-[#111] border border-gray-800 p-6 rounded-xl hover:border-indigo-500/50 transition-colors cursor-pointer group flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-gray-900/50 w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Server className="w-6 h-6 text-indigo-400" />
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${db.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    {db.status.toUpperCase()}
                  </span>
                  <button 
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (confirm('Are you sure you want to disconnect this database?')) {
                        await fetch(`/api/databases?id=${db.id}`, { method: 'DELETE' });
                        fetchDatabases();
                      }
                    }}
                    className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-md transition-colors"
                    title="Disconnect Database"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-1">{db.name}</h3>
              <div className="flex gap-2 text-sm text-gray-400 mb-4">
                <span className="bg-gray-800 px-2 py-0.5 rounded">{db.engine.toUpperCase()}</span>
                <span className="flex items-center gap-1 bg-gray-800 px-2 py-0.5 rounded">
                  <Shield className="w-3 h-3" /> {db.accessMode}
                </span>
              </div>
              <p className="text-gray-400 text-sm mb-6 flex-1">
                {db.tablesCount} Tables synchronized and embedded into Knowledge Tree.
              </p>
              
              <div className="flex gap-2 mt-auto border-t border-gray-800 pt-4">
                <Link href={`/databases/${db.id}/sql-studio`} className="flex-1 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 text-sm font-medium py-2 rounded text-center flex items-center justify-center" title="Ask natural language questions that translate into SQL queries against this DB.">
                  NL to SQL Chat
                </Link>
                <button className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium py-2 rounded flex items-center justify-center gap-2" title="Coming Soon: Auto-generated AI Documentation detailing the DB schema and relationships.">
                  <FileText className="w-4 h-4" /> Docs
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111] border border-gray-800 rounded-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Add Database Source</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddDatabase} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Connection Name</label>
                <input required type="text" value={newDb.name} onChange={e => setNewDb({...newDb, name: e.target.value})} className="w-full bg-[#0a0a0a] border border-gray-800 rounded-lg px-3 py-2 text-white" placeholder="Production DB" />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">Engine</label>
                <select value={newDb.engine} onChange={e => setNewDb({...newDb, engine: e.target.value})} className="w-full bg-[#0a0a0a] border border-gray-800 rounded-lg px-3 py-2 text-white">
                  <option value="pg">PostgreSQL</option>
                  <option value="mysql">MySQL</option>
                  <option value="mssql">SQL Server</option>
                  <option value="mongodb">MongoDB</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Host</label>
                  <input required type="text" value={newDb.host} onChange={e => setNewDb({...newDb, host: e.target.value})} className="w-full bg-[#0a0a0a] border border-gray-800 rounded-lg px-3 py-2 text-white" placeholder="localhost" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Port</label>
                  <input type="text" value={newDb.port} onChange={e => setNewDb({...newDb, port: e.target.value})} className="w-full bg-[#0a0a0a] border border-gray-800 rounded-lg px-3 py-2 text-white" placeholder="1433 (optional)" />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Database Name</label>
                <input required type="text" value={newDb.database} onChange={e => setNewDb({...newDb, database: e.target.value})} className="w-full bg-[#0a0a0a] border border-gray-800 rounded-lg px-3 py-2 text-white" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Username</label>
                  <input required type="text" value={newDb.username} onChange={e => setNewDb({...newDb, username: e.target.value})} className="w-full bg-[#0a0a0a] border border-gray-800 rounded-lg px-3 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Password</label>
                  <input required type="password" value={newDb.password} onChange={e => setNewDb({...newDb, password: e.target.value})} className="w-full bg-[#0a0a0a] border border-gray-800 rounded-lg px-3 py-2 text-white" />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50 flex justify-center items-center gap-2">
                  {saving && <Activity className="w-4 h-4 animate-spin" />}
                  {saving ? 'Connecting...' : 'Connect'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
