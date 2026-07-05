"use client";

import React, { useState, useEffect } from 'react';
import { Database, Plus, Server, Shield, Activity, X, Settings, ExternalLink, Copy, CheckCircle2 } from 'lucide-react';

export default function MCPBuilder() {
  const [servers, setServers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedServer, setSelectedServer] = useState<any | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);

  useEffect(() => {
    fetchServers();
  }, []);

  const fetchServers = async () => {
    try {
      const res = await fetch('/api/mcp-builder/servers');
      if (res.ok) {
        const data = await res.json();
        setServers(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateServer = async () => {
    setIsCreating(true);
    try {
      const res = await fetch('/api/mcp-builder/servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: "My GenWorkAI Hub",
          description: "Global access to my GenWorkAI Knowledge Base",
          kbIds: [], // Bound to all/global or specific KBs
          permissionLevel: "read_only"
        })
      });
      if (res.ok) {
        const data = await res.json();
        setNewKey(data.key.rawKey);
        await fetchServers();
        // Automatically select the new server
        const newServerWithKey = { ...data.server, keys: [data.key] };
        setSelectedServer(newServerWithKey);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create MCP Server');
      }
    } catch(e) {
      console.error(e);
    }
    setIsCreating(false);
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const getBaseUrl = () => {
    return typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full h-full text-foreground bg-background overflow-y-auto custom-scrollbar">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Settings className="w-8 h-8 text-indigo-500" />
            MCP Hub
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 dark:text-zinc-500 dark:text-zinc-400 mt-2">Export your GenWorkAI Knowledge Base as an MCP Server to use with Claude Desktop or Cursor.</p>
        </div>
        <button 
          onClick={handleCreateServer}
          disabled={isCreating}
          className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          {isCreating ? <Activity className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
          Create New MCP Hub
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Activity className="w-8 h-8 text-indigo-500 animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servers.map((server) => (
            <div key={server.id} className="bg-card border border-zinc-200 dark:border-white/10 p-6 rounded-xl hover:border-indigo-500/50 transition-colors cursor-pointer group flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-card/50 w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Server className="w-6 h-6 text-indigo-400" />
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${server.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                  {server.status?.toUpperCase() || 'ACTIVE'}
                </span>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-1">{server.name}</h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-4 line-clamp-2">
                {server.description || 'No description provided.'}
              </p>
              
              <div className="mt-auto pt-4 border-t border-zinc-200 dark:border-white/10 flex gap-2">
                <button 
                  onClick={() => {
                    setNewKey(null); // Clear new key if opening existing
                    setSelectedServer(server);
                  }}
                  className="flex-1 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 py-2 rounded-md font-medium text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Generate MCP Config
                </button>
              </div>
            </div>
          ))}
          {servers.length === 0 && (
            <div className="col-span-full py-20 text-center text-zinc-500 dark:text-zinc-400 border border-dashed border-zinc-200 dark:border-white/10 rounded-xl bg-card">
              <Server className="w-12 h-12 mx-auto mb-4 text-gray-600" />
              <p>No MCP Hubs created. Click "Create New MCP Hub" to begin.</p>
            </div>
          )}
        </div>
      )}

      {/* MCP Config Modal */}
      {selectedServer && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-zinc-200 dark:border-white/10 p-8 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Settings className="w-6 h-6 text-indigo-500" />
                MCP Config: {selectedServer.name}
              </h2>
              <button onClick={() => setSelectedServer(null)} className="text-zinc-500 dark:text-zinc-400 dark:text-zinc-500 dark:text-zinc-400 hover:text-foreground">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="bg-blue-900/10 border border-blue-900/30 p-4 rounded-lg mb-6 flex gap-3 text-sm text-blue-200">
              <Shield className="w-5 h-5 text-blue-400 shrink-0" />
              <p>This MCP Server is strictly <strong>Read-Only</strong>. Your IDE AI can search your knowledge base and view architecture, but cannot modify data.</p>
            </div>

            {newKey && (
              <div className="bg-green-900/20 border border-green-500/50 p-4 rounded-lg mb-6">
                <h3 className="text-green-400 font-bold mb-2">New API Key Generated!</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3">Copy this key now. You won't be able to see it again.</p>
                <div className="bg-white dark:bg-background p-3 rounded flex justify-between items-center border border-green-500/30">
                  <code className="text-green-400 font-mono break-all">{newKey}</code>
                  <button onClick={() => copyToClipboard(newKey, 'key')} className="text-zinc-500 dark:text-zinc-400 dark:text-zinc-500 dark:text-zinc-400 hover:text-foreground ml-4 shrink-0">
                    {copied === 'key' ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-8">
              {/* Option 1: SSE Integrations */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground">Option 1: SSE IDEs (Cursor, Windsurf, Antigravity)</h3>
                <p className="text-zinc-500 dark:text-zinc-400 dark:text-zinc-500 dark:text-zinc-400 text-sm">For AI IDEs with native SSE Support, add a new MCP Server and set the connection type to SSE. (e.g. in Cursor: Settings &gt; Features &gt; MCP)</p>
                
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">URL</label>
                    <div className="bg-background p-3 rounded-lg border border-zinc-200 dark:border-white/10 relative">
                      <div className="font-mono text-sm text-indigo-400">{getBaseUrl()}/api/mcp/sse</div>
                      <button onClick={() => copyToClipboard(`${getBaseUrl()}/api/mcp/sse`, 'url')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400 hover:text-foreground">
                        {copied === 'url' ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">Custom Headers (JSON)</label>
                    <div className="bg-background p-3 rounded-lg border border-zinc-200 dark:border-white/10 relative">
                      <div className="font-mono text-sm text-zinc-500 dark:text-zinc-400">
                        {`{ "Authorization": "Bearer ${newKey || 'YOUR_API_KEY'}" }`}
                      </div>
                      <button onClick={() => copyToClipboard(`{ "Authorization": "Bearer ${newKey || 'YOUR_API_KEY'}" }`, 'header')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400 hover:text-foreground">
                        {copied === 'header' ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Option 2: Claude Desktop Config */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground">Option 2: Claude Desktop Config</h3>
                <p className="text-zinc-500 dark:text-zinc-400 dark:text-zinc-500 dark:text-zinc-400 text-sm">Paste this into your <code>claude_desktop_config.json</code>. We use the official <code>@modelcontextprotocol/sse-client</code> to bridge the connection securely.</p>
                
                <div className="bg-background rounded-lg border border-zinc-200 dark:border-white/10 overflow-hidden relative">
                  <div className="flex justify-between items-center bg-white dark:bg-[#1e1e1e] px-4 py-2 border-b border-zinc-200 dark:border-white/10">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 dark:text-zinc-500 dark:text-zinc-400 font-mono">claude_desktop_config.json</span>
                    <button 
                      onClick={() => {
                        const config = {
                          mcpServers: {
                            [`genworkai-hub`]: {
                              command: "npx",
                              args: [
                                "-y", 
                                "@modelcontextprotocol/sse-client",
                                `${getBaseUrl()}/api/mcp/sse`
                              ],
                              env: {
                                "AUTHORIZATION": `Bearer ${newKey || 'YOUR_API_KEY'}`
                              }
                            }
                          }
                        };
                        copyToClipboard(JSON.stringify(config, null, 2), 'claude');
                      }}
                      className="text-zinc-500 dark:text-zinc-400 dark:text-zinc-500 dark:text-zinc-400 hover:text-foreground flex items-center gap-1 text-xs"
                    >
                      {copied === 'claude' ? <><CheckCircle2 className="w-3 h-3 text-green-500" /> Copied</> : <><Copy className="w-3 h-3" /> Copy JSON</>}
                    </button>
                  </div>
                  <pre className="p-4 text-sm font-mono text-zinc-500 dark:text-zinc-400 overflow-x-auto">
{`{
  "mcpServers": {
    "genworkai-hub": {
      "command": "npx",
      "args": [
        "-y", 
        "@modelcontextprotocol/sse-client", 
        "${getBaseUrl()}/api/mcp/sse",
        "--header",
        "Authorization: Bearer ${newKey || 'YOUR_API_KEY'}"
      ]
    }
  }
}`}
                  </pre>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      )}
    </div>
  );
}