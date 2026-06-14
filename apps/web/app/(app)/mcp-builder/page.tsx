'use client';

import { useState, useEffect } from 'react';
import { Plus, Server, Key, Shield, Layers, RefreshCw, Box, Download, Copy, CheckCircle2, ChevronRight, Check } from 'lucide-react';
import Link from 'next/link';

export default function McpBuilderPage() {
  const [servers, setServers] = useState<any[]>([]);
  const [kbs, setKbs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedKbs, setSelectedKbs] = useState<number[]>([]);
  const [capabilities, setCapabilities] = useState<string[]>(['knowledge', 'features']);
  const [permission, setPermission] = useState('read_only');
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [serversRes, kbsRes] = await Promise.all([
        fetch('/api/mcp-builder/servers'),
        fetch('/api/knowledge/list')
      ]);
      const serversData = await serversRes.json();
      const kbsData = await kbsRes.json();
      
      setServers(serversData);
      setKbs(kbsData.kbs || kbsData || []);
    } catch (err) {
      console.error("Failed to load MCP builder data", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const res = await fetch('/api/mcp-builder/servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          kbIds: selectedKbs,
          enabledCapabilities: capabilities,
          permissionLevel: permission
        })
      });

      const data = await res.json();
      if (data.server) {
        setNewKey(data.key.rawKey);
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleKb = (id: number) => {
    setSelectedKbs(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleCapability = (cap: string) => {
    setCapabilities(prev => prev.includes(cap) ? prev.filter(x => x !== cap) : [...prev, cap]);
  };

  const copyKey = () => {
    if (newKey) {
      navigator.clipboard.writeText(newKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const closeCreateModal = () => {
    setShowCreate(false);
    setNewKey(null);
    setName('');
    setDescription('');
    setSelectedKbs([]);
    setCapabilities(['knowledge', 'features']);
  };

  return (
    <div className="h-full flex flex-col bg-[#050505]">
      <div className="border-b border-white/5 bg-[#0a0a0c] p-6 z-10 flex-shrink-0">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-zinc-400 text-sm font-medium mb-1">
              <span>MCP Deployments</span>
            </div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Server className="w-6 h-6 text-fuchsia-500" />
              Knowledge Operating System
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              Deploy custom Model Context Protocol (MCP) servers to expose business logic and artifact generation to external AI agents.
            </p>
          </div>
          
          <button 
            onClick={() => setShowCreate(true)}
            className="bg-white text-black hover:bg-zinc-200 px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New MCP Server
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          {isLoading ? (
            <div className="text-zinc-500 text-center py-20 animate-pulse">Loading servers...</div>
          ) : servers.length === 0 ? (
            <div className="border border-dashed border-white/10 rounded-2xl p-12 text-center bg-black/20">
              <Server className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">No MCP Servers Deployed</h3>
              <p className="text-zinc-400 mb-6 max-w-md mx-auto">
                Create an MCP server to allow external agents like Claude to interact directly with your GenWorkAI workspaces.
              </p>
              <button 
                onClick={() => setShowCreate(true)}
                className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                Deploy Your First Server
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {servers.map(server => (
                <div key={server.id} className="bg-[#121217] border border-white/5 rounded-2xl p-6 group transition-all hover:border-white/10">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-fuchsia-500/10 flex items-center justify-center text-fuchsia-500">
                        <Server className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{server.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <span className="text-xs font-medium text-emerald-500 uppercase tracking-wider">{server.status}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-zinc-400 mb-6">{server.description}</p>
                  
                  <div className="flex gap-4 mb-6">
                    <div className="flex-1 bg-black/40 rounded-xl p-3 border border-white/5">
                      <div className="text-xs text-zinc-500 mb-1 flex items-center gap-1.5"><Layers className="w-3.5 h-3.5"/> Connected KBs</div>
                      <div className="text-sm font-medium text-zinc-200">
                        {server.kbIds?.length || 0} Sources
                      </div>
                    </div>
                    <div className="flex-1 bg-black/40 rounded-xl p-3 border border-white/5">
                      <div className="text-xs text-zinc-500 mb-1 flex items-center gap-1.5"><Shield className="w-3.5 h-3.5"/> Access Level</div>
                      <div className="text-sm font-medium text-zinc-200">
                        {server.keys?.[0]?.permissionLevel === 'read_generate' ? 'Read + Generate' : 'Read Only'}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-4">
                    <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Enabled Capabilities</h4>
                    <div className="flex flex-wrap gap-2">
                      {server.enabledCapabilities?.map((cap: string) => (
                        <span key={cap} className="px-2.5 py-1 rounded-md bg-white/5 text-zinc-300 text-xs capitalize font-medium border border-white/5">
                          {cap}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-white/5">
                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <span>Server Endpoint URL:</span>
                      <code className="text-zinc-400 bg-black/50 px-2 py-1 rounded border border-white/5">
                        http://localhost:3000/api/mcp/messages
                      </code>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#121217] border border-white/10 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-white/5 shrink-0 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">Deploy MCP Server</h2>
                <p className="text-sm text-zinc-400 mt-1">Configure an external interface for your AI agents.</p>
              </div>
              <button onClick={closeCreateModal} className="text-zinc-500 hover:text-white">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              {newKey ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 text-center">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 mx-auto mb-4">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-emerald-400 mb-2">Server Deployed Successfully!</h3>
                  <p className="text-sm text-emerald-400/80 mb-6">
                    Please copy your Secret API Key now. You will not be able to see it again.
                  </p>
                  <div className="flex items-center gap-2 max-w-md mx-auto">
                    <code className="flex-1 bg-black/50 border border-emerald-500/30 rounded-lg p-3 text-emerald-300 font-mono text-sm break-all">
                      {newKey}
                    </code>
                    <button 
                      onClick={copyKey}
                      className="bg-emerald-500 text-black p-3 rounded-lg hover:bg-emerald-400 transition-colors"
                    >
                      {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                  
                  <div className="mt-8 text-left max-w-md mx-auto bg-black/40 border border-white/5 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-white mb-2">Claude Desktop Config</h4>
                    <pre className="text-xs text-zinc-400 font-mono bg-[#0a0a0c] p-3 rounded-lg border border-white/5 overflow-x-auto">
{`"genworkai": {
  "command": "npx",
  "args": ["-y", "@genworkai/mcp-client", "http://localhost:3000/api/mcp/sse"],
  "env": {
    "GENWORKAI_API_KEY": "${newKey}"
  }
}`}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-1.5">Server Name</label>
                      <input 
                        type="text" 
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="e.g. GymSaaS Developer MCP" 
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-fuchsia-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-1.5">Description</label>
                      <input 
                        type="text" 
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="What will this server be used for?" 
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-fuchsia-500"
                      />
                    </div>
                  </div>

                  {/* KBs */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-3">Bind Knowledge Bases</label>
                    <div className="grid grid-cols-2 gap-3">
                      {kbs.map(kb => (
                        <div 
                          key={kb.id} 
                          onClick={() => toggleKb(kb.id)}
                          className={`p-3 rounded-xl border cursor-pointer flex items-center gap-3 transition-colors ${
                            selectedKbs.includes(kb.id) 
                              ? 'bg-fuchsia-500/10 border-fuchsia-500/50 text-fuchsia-400' 
                              : 'bg-black/40 border-white/5 text-zinc-400 hover:bg-white/5'
                          }`}
                        >
                          <DatabaseIcon className="w-4 h-4 shrink-0" />
                          <span className="text-sm font-medium truncate">{kb.name}</span>
                        </div>
                      ))}
                      {kbs.length === 0 && <div className="text-sm text-zinc-500 col-span-2">No knowledge bases found.</div>}
                    </div>
                  </div>

                  {/* Capabilities Builder */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-3">Capabilities Builder (Layers 0-4)</label>
                    <div className="space-y-3">
                      {[
                        { id: 'sources', name: 'Layer 0: Sources', desc: 'Allow agents to read raw sources and trigger syncs (GitHub, DBs)', icon: <RefreshCw className="w-4 h-4"/> },
                        { id: 'knowledge', name: 'Layer 1: Knowledge', desc: 'Semantic search and architectural tree views', icon: <Server className="w-4 h-4"/> },
                        { id: 'features', name: 'Layer 2: Features & Flows', desc: 'Read and update business logic definitions', icon: <Layers className="w-4 h-4"/> },
                        { id: 'generation', name: 'Layer 3: Artifact Templates', desc: 'Generate SOPs, PRDs, API Docs, and Postman collections', icon: <Box className="w-4 h-4"/> },
                        { id: 'workspace', name: 'Layer 4: Workspace Ops', desc: 'Collaborate natively with GenWorkAI user workspaces', icon: <Download className="w-4 h-4"/> },
                      ].map(cap => (
                        <div 
                          key={cap.id}
                          onClick={() => toggleCapability(cap.id)}
                          className={`p-4 rounded-xl border cursor-pointer flex items-start gap-4 transition-colors ${
                            capabilities.includes(cap.id) 
                              ? 'bg-white/5 border-white/20' 
                              : 'bg-black/40 border-white/5 opacity-60 hover:opacity-100 hover:bg-black/60'
                          }`}
                        >
                          <div className={`mt-0.5 ${capabilities.includes(cap.id) ? 'text-fuchsia-400' : 'text-zinc-500'}`}>
                            {cap.icon}
                          </div>
                          <div className="flex-1">
                            <h4 className={`text-sm font-semibold mb-1 ${capabilities.includes(cap.id) ? 'text-white' : 'text-zinc-400'}`}>
                              {cap.name}
                            </h4>
                            <p className="text-xs text-zinc-500">{cap.desc}</p>
                          </div>
                          <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                            capabilities.includes(cap.id) ? 'bg-fuchsia-500 border-fuchsia-500' : 'border-white/20 bg-black/50'
                          }`}>
                            {capabilities.includes(cap.id) && <Check className="w-3 h-3 text-white" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Security */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-3">Security & Permissions</label>
                    <div className="grid grid-cols-2 gap-3">
                      <div 
                        onClick={() => setPermission('read_only')}
                        className={`p-4 rounded-xl border cursor-pointer ${
                          permission === 'read_only' ? 'bg-fuchsia-500/10 border-fuchsia-500/50' : 'bg-black/40 border-white/5'
                        }`}
                      >
                        <h4 className={`text-sm font-bold mb-1 ${permission === 'read_only' ? 'text-fuchsia-400' : 'text-zinc-400'}`}>Read Only</h4>
                        <p className="text-xs text-zinc-500">Agent can read knowledge but cannot generate artifacts or modify flows.</p>
                      </div>
                      <div 
                        onClick={() => setPermission('read_generate')}
                        className={`p-4 rounded-xl border cursor-pointer ${
                          permission === 'read_generate' ? 'bg-fuchsia-500/10 border-fuchsia-500/50' : 'bg-black/40 border-white/5'
                        }`}
                      >
                        <h4 className={`text-sm font-bold mb-1 ${permission === 'read_generate' ? 'text-fuchsia-400' : 'text-zinc-400'}`}>Read + Generate</h4>
                        <p className="text-xs text-zinc-500">Agent has full capability execution rights based on the selected layers.</p>
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>

            <div className="p-6 border-t border-white/5 bg-[#0a0a0c] shrink-0 flex justify-end gap-3">
              {!newKey ? (
                <>
                  <button 
                    onClick={closeCreateModal}
                    className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleCreate}
                    disabled={!name || selectedKbs.length === 0 || capabilities.length === 0}
                    className="bg-white text-black hover:bg-zinc-200 px-6 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Deploy Server
                  </button>
                </>
              ) : (
                <button 
                  onClick={closeCreateModal}
                  className="bg-white text-black hover:bg-zinc-200 px-6 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  Done
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DatabaseIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5V19A9 3 0 0 0 21 19V5" />
      <path d="M3 12A9 3 0 0 0 21 12" />
    </svg>
  );
}