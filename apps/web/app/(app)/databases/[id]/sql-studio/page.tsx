"use client";

import React, { useState, useEffect, useRef, use } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';
import { Play, Terminal, Database, Sparkles, Send, Loader2, ArrowLeft, GripHorizontal, GripVertical } from 'lucide-react';
import Link from 'next/link';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

export default function SQLStudio({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [dbId, setDbId] = useState<string | null>(resolvedParams.id);
  const [query, setQuery] = useState('SELECT * FROM information_schema.tables;');
  const [results, setResults] = useState<any[] | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [schema, setSchema] = useState<any>(null);

  // Chat state
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
    { role: 'assistant', content: "Hi! I'm your AI Database Assistant. Ask me anything about this database, and I'll write the SQL for you." }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  const monaco = useMonaco();
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (dbId) {
      fetchSchema(dbId);
    }
  }, [dbId]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const fetchSchema = async (id: string) => {
    try {
      const res = await fetch(`/api/databases/${id}/schema`);
      const data = await res.json();
      if (data.schema) {
        setSchema(data.schema);
        setupAutocomplete(data.schema);
      }
    } catch (err) {
      console.error("Failed to fetch schema", err);
    }
  };

  const setupAutocomplete = (dbSchema: any) => {
    if (!monaco) return;
    
    // Register custom SQL completion provider for Redgate-like experience
    monaco.languages.registerCompletionItemProvider('sql', {
      provideCompletionItems: (model, position) => {
        const suggestions: any[] = [];

        // Add SSMS snippet 'ssf'
        suggestions.push({
          label: 'ssf',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'SELECT * FROM ',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: 'SSMS Snippet',
          documentation: 'Generates SELECT * FROM '
        });
        
        // Add tables
        Object.keys(dbSchema).forEach(table => {
          suggestions.push({
            label: table,
            kind: monaco.languages.CompletionItemKind.Struct,
            insertText: table,
            detail: 'Table'
          });

          // Add columns
          const cols = dbSchema[table];
          if (Array.isArray(cols)) {
            cols.forEach(col => {
              suggestions.push({
                label: col.column,
                kind: monaco.languages.CompletionItemKind.Field,
                insertText: col.column,
                detail: `Column in ${table} (${col.type})`
              });
            });
          }
        });

        return { suggestions };
      }
    });
  };

  useEffect(() => {
    if (schema) setupAutocomplete(schema);
  }, [monaco, schema]);

  const executeQuery = async () => {
    if (!dbId || !query.trim()) return;
    setIsExecuting(true);
    setError(null);
    setResults(null);
    setColumns([]);

    try {
      const res = await fetch(`/api/databases/${dbId}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const data = await res.json();

      if (res.ok) {
        setResults(data.results);
        if (data.results && data.results.length > 0) {
          setColumns(Object.keys(data.results[0]));
        }
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message || "Execution failed");
    } finally {
      setIsExecuting(false);
    }
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !dbId) return;

    const userMsg = chatInput.trim();
    setChatInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsThinking(true);

    try {
      const res = await fetch(`/api/databases/${dbId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg })
      });
      
      const data = await res.json();
      if (res.ok) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
        if (data.sql) {
          setQuery(data.sql);
        }
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${data.error}` }]);
      }
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Failed to reach AI Assistant." }]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden font-sans">
      <PanelGroup direction="horizontal">
        
        {/* Left Main Content: Editor & Terminal Split */}
        <Panel defaultSize={75} minSize={30}>
          <div className="flex h-full flex-col min-w-0">
            
            {/* Header Bar */}
            <div className="h-14 border-b border-gray-800 bg-[#111] flex items-center justify-between px-4 shrink-0">
              <div className="flex items-center gap-3">
                <Link href="/databases" className="text-gray-400 hover:text-white transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <Database className="w-5 h-5 text-indigo-500" />
                <span className="font-semibold text-gray-200">AI SQL Studio</span>
              </div>
              <button 
                onClick={executeQuery}
                disabled={isExecuting}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-md flex items-center gap-2 text-sm font-medium disabled:opacity-50 transition-colors"
              >
                {isExecuting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Run Query
              </button>
            </div>

            <div className="flex-1">
              <PanelGroup direction="vertical">
                {/* Top Pane: Monaco Editor */}
                <Panel defaultSize={50} minSize={20}>
                  <div className="h-full flex flex-col relative bg-[#1e1e1e]">
                    <div className="absolute top-2 right-4 z-10 px-2 py-1 bg-gray-800 rounded text-xs text-gray-400 select-none pointer-events-none opacity-50">
                      SQL Editor
                    </div>
                    <Editor
                      height="100%"
                      defaultLanguage="sql"
                      theme="vs-dark"
                      value={query}
                      onChange={(val) => setQuery(val || '')}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                        padding: { top: 16 },
                        suggestOnTriggerCharacters: true,
                        wordBasedSuggestions: 'off'
                      }}
                    />
                  </div>
                </Panel>

                <PanelResizeHandle className="h-1.5 bg-gray-800 hover:bg-indigo-500 transition-colors flex items-center justify-center group cursor-row-resize">
                  <div className="w-8 h-1 rounded-full bg-gray-600 group-hover:bg-white transition-colors" />
                </PanelResizeHandle>

                {/* Bottom Pane: Results Terminal */}
                <Panel defaultSize={50} minSize={20}>
                  <div className="h-full flex flex-col bg-[#0d0d0d]">
                    <div className="h-10 bg-[#111] border-b border-gray-800 flex items-center px-4 gap-2 shrink-0">
                      <Terminal className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-300">Results</span>
                      {results && <span className="ml-auto text-xs text-gray-500">{results.length} rows</span>}
                    </div>
                    
                    <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                      {error && (
                        <div className="text-red-400 font-mono text-sm bg-red-900/10 p-4 rounded border border-red-900/30">
                          {error}
                        </div>
                      )}
                      
                      {results && results.length === 0 && (
                        <div className="text-gray-500 italic text-sm">Query executed successfully. 0 rows returned.</div>
                      )}
                      
                      {results && results.length > 0 && (
                        <div className="inline-block min-w-full">
                          <table className="min-w-full text-left text-sm whitespace-nowrap">
                            <thead className="border-b border-gray-800">
                              <tr>
                                {columns.map(col => (
                                  <th key={col} className="px-4 py-2 font-semibold text-gray-300 bg-[#111] sticky top-0">{col}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/50 font-mono text-gray-400">
                              {results.map((row, i) => (
                                <tr key={i} className="hover:bg-gray-800/20">
                                  {columns.map(col => (
                                    <td key={`${i}-${col}`} className="px-4 py-2">
                                      {row[col] !== null ? String(row[col]) : <span className="text-gray-600 italic">NULL</span>}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                      
                      {!results && !error && !isExecuting && (
                        <div className="text-gray-600 italic text-sm flex items-center justify-center h-full">
                          Execute a query to see results here.
                        </div>
                      )}
                      
                      {isExecuting && (
                        <div className="flex items-center justify-center h-full gap-2 text-indigo-400">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Executing...
                        </div>
                      )}
                    </div>
                  </div>
                </Panel>
              </PanelGroup>
            </div>
          </div>
        </Panel>

        <PanelResizeHandle className="w-1.5 bg-gray-800 hover:bg-indigo-500 transition-colors flex items-center justify-center group cursor-col-resize">
          <div className="h-8 w-1 rounded-full bg-gray-600 group-hover:bg-white transition-colors" />
        </PanelResizeHandle>

        {/* Right Sidebar: AI Chat Panel */}
        <Panel defaultSize={25} minSize={15} maxSize={40}>
          <div className="h-full bg-[#111] flex flex-col shrink-0">
            <div className="h-14 border-b border-gray-800 flex items-center px-4 gap-2 bg-indigo-600/5 shrink-0">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <span className="font-semibold text-indigo-400">AI SQL Assistant</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    m.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-br-none' 
                      : 'bg-[#1e1e1e] border border-gray-800 text-gray-300 rounded-bl-none'
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {isThinking && (
                <div className="flex justify-start">
                  <div className="bg-[#1e1e1e] border border-gray-800 rounded-2xl rounded-bl-none px-4 py-2.5 text-sm text-gray-400 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Thinking & Writing SQL...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            
            <form onSubmit={handleChat} className="p-4 border-t border-gray-800 bg-[#0a0a0a] shrink-0">
              <div className="relative flex items-center">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder="Ask a question..."
                  className="w-full bg-[#111] border border-gray-800 rounded-full pl-4 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <button 
                  type="submit" 
                  disabled={isThinking || !chatInput.trim()}
                  className="absolute right-2 p-1.5 text-indigo-500 hover:text-indigo-400 disabled:opacity-50 disabled:hover:text-indigo-500 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div className="text-center mt-2">
                <span className="text-[10px] text-gray-600 uppercase tracking-wider font-semibold">SQL will auto-populate in the editor</span>
              </div>
            </form>
          </div>
        </Panel>
      </PanelGroup>
      
      {/* Custom Scrollbar CSS (Global or Inline) */}
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
