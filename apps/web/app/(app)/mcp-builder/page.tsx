"use client";

import React, { useState, useEffect } from 'react';
import { Database, Plus, Search, Server, Shield, Activity, FileText, X, Settings, ExternalLink, Copy, CheckCircle2 } from 'lucide-react';

export default function MCPBuilder() {
  const [databases, setDatabases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDb, setSelectedDb] = useState<any | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetchDatabases();
  }, []);

  const fetchDatabases = async () => {
    try {
      const res = await fetch('/api/databases');
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

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full h-full text-white bg-[#0a0a0a] overflow-y-auto custom-scrollbar">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Settings className="w-8 h-8 text-indigo-500" />
          MCP Hub / Builder
        </h1>
        <p className="text-gray-400 mt-2">Export your GenWorkAI Database Intelligence as an MCP Server to use with Claude Desktop, Cursor, or any other MCP-compatible AI agent.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Activity className="w-8 h-8 text-indigo-500 animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {databases.map((db) => (
            <div key={db.id} className="bg-[#111] border border-gray-800 p-6 rounded-xl hover:border-indigo-500/50 transition-colors cursor-pointer group flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-gray-900/50 w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Database className="w-6 h-6 text-indigo-400" />
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${db.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                  {db.status?.toUpperCase() || 'ACTIVE'}
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-100 mb-1">{db.name.replace('Database: ', '')}</h3>
              <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                Engine: {db.engine.toUpperCase()}<br/>
                Host: {db.host}
              </p>
              
              <div className="mt-auto pt-4 border-t border-gray-800/50 flex gap-2">
                <button 
                  onClick={() => setSelectedDb(db)}
                  className="flex-1 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 py-2 rounded-md font-medium text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Generate MCP Config
                </button>
              </div>
            </div>
          ))}
          {databases.length === 0 && (
            <div className="col-span-full py-20 text-center text-gray-500 border border-dashed border-gray-800 rounded-xl bg-[#111]">
              <Database className="w-12 h-12 mx-auto mb-4 text-gray-600" />
              <p>No databases connected. Head to Database Intelligence to add one.</p>
            </div>
          )}
        </div>
      )}

      {/* MCP Config Modal */}
      {selectedDb && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111] border border-gray-800 p-8 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Settings className="w-6 h-6 text-indigo-500" />
                MCP Config: {selectedDb.name.replace('Database: ', '')}
              </h2>
              <button onClick={() => setSelectedDb(null)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="bg-blue-900/10 border border-blue-900/30 p-4 rounded-lg mb-6 flex gap-3 text-sm text-blue-200">
              <Shield className="w-5 h-5 text-blue-400 shrink-0" />
              <p>This MCP Server is strictly <strong>Read-Only</strong>. Only <code>SELECT</code> queries are permitted. The AI cannot drop tables, insert data, or modify your schema.</p>
            </div>

            <div className="space-y-8">
              {/* Option 1: Cursor / Web SSE */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-200">Option 1: Cursor / Continue (SSE URL)</h3>
                <p className="text-gray-400 text-sm">Use this method for MCP clients that support HTTP/SSE connections. In Cursor, go to Features &gt; MCP and add a new Server.</p>
                <div className="bg-[#0a0a0a] p-4 rounded-lg border border-gray-800 relative">
                  <div className="font-mono text-sm text-indigo-400 break-all pr-12">
                    {typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/api/mcp/sse?sessionId=db-{selectedDb.id}
                  </div>
                  <button 
                    onClick={() => copyToClipboard(`${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/api/mcp/sse?sessionId=db-${selectedDb.id}`, 'sse')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                  >
                    {copied === 'sse' ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
                <div className="text-xs text-gray-500 mt-1">Set the Type to "SSE" in your client settings.</div>
              </div>

              {/* Option 2: Claude Desktop Config */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-200">Option 2: Claude Desktop Config</h3>
                <p className="text-gray-400 text-sm">Claude Desktop requires a local command to run via standard input/output (`stdio`). Paste this into your <code>claude_desktop_config.json</code>.</p>
                
                <div className="bg-[#0a0a0a] rounded-lg border border-gray-800 overflow-hidden relative">
                  <div className="flex justify-between items-center bg-[#1e1e1e] px-4 py-2 border-b border-gray-800">
                    <span className="text-xs text-gray-400 font-mono">claude_desktop_config.json</span>
                    <button 
                      onClick={() => {
                        const config = {
                          mcpServers: {
                            [`genworkai-db-${selectedDb.id}`]: {
                              command: "node",
                              args: ["scripts/mcp-bridge.js", `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/api/mcp/sse?sessionId=db-${selectedDb.id}`]
                            }
                          }
                        };
                        copyToClipboard(JSON.stringify(config, null, 2), 'claude');
                      }}
                      className="text-gray-400 hover:text-white flex items-center gap-1 text-xs"
                    >
                      {copied === 'claude' ? <><CheckCircle2 className="w-3 h-3 text-green-500" /> Copied</> : <><Copy className="w-3 h-3" /> Copy JSON</>}
                    </button>
                  </div>
                  <pre className="p-4 text-sm font-mono text-gray-300 overflow-x-auto">
{`{
  "mcpServers": {
    "genworkai-db-${selectedDb.id}": {
      "command": "node",
      "args": [
        "scripts/mcp-bridge.js", 
        "${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/api/mcp/sse?sessionId=db-${selectedDb.id}"
      ]
    }
  }
}`}
                  </pre>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Note: The Claude Desktop config uses our local <code>mcp-bridge.js</code> tool to convert the cloud SSE stream into a local stdio stream.
                </div>
              </div>
              
            </div>
            
          </div>
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}} />
    </div>
  );
}