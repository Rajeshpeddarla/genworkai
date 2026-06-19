"use client";

import React, { useState, useEffect, useRef, use } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';
import { Play, Terminal, Database, Sparkles, Send, Loader2, ArrowLeft, GripHorizontal, GripVertical } from 'lucide-react';
import Link from 'next/link';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

function flattenSchema(schema: any) {
  if (!schema) return [];
  if (schema.__multiDb) {
    return Object.entries(schema.databases).flatMap(([db, tables]: any) =>
      Object.entries(tables).map(([table, columns]: any) => ({ db, table, columns })));
  }
  return Object.entries(schema).map(([table, columns]: any) => ({ table, columns }));
}

function TableNode({ db, table, cols, open, onToggle, onInsert }: any) {
  return (
    <div>
      <div className="flex items-center group">
        <button onClick={onToggle} className="px-1 text-gray-500">{open?'▾':'▸'}</button>
        <button onClick={onInsert}
          className="flex-1 text-left py-1 rounded hover:bg-gray-800 text-gray-300 truncate">
          {table}
        </button>
      </div>
      {open && Array.isArray(cols) && (
        <div className="ml-6 border-l border-gray-800">
          {cols.map((c:any) => (
            <div key={c.column} className="px-2 py-0.5 text-xs text-gray-500 flex justify-between">
              <span>{c.column}</span><span className="text-gray-600">{c.type}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SQLStudio({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [dbId, setDbId] = useState<string | null>(resolvedParams.id);
  const [query, setQuery] = useState('SELECT * FROM information_schema.tables;');
  const [resultSets, setResultSets] = useState<any[][] | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [schema, setSchema] = useState<any>(null);

  const [openDb, setOpenDb] = useState<string|null>(null);
  const [openTable, setOpenTable] = useState<string|null>(null);

  // Chat state
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
    { role: 'assistant', content: "Hi! I'm your AI Database Assistant. Ask me anything about this database, and I'll write the SQL for you." }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [editorInstance, setEditorInstance] = useState<any>(null);

  const monaco = useMonaco();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const schemaPanelRef = useRef<any>(null);

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
      triggerCharacters: [' ', '.'],
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const suggestions: any[] = [];

        // Add SSMS snippet 'ssf'
        suggestions.push({
          label: 'ssf',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'SELECT * FROM ',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: 'SSMS Snippet',
          documentation: 'Generates SELECT * FROM ',
          range
        });
        
        flattenSchema(dbSchema).forEach(({ table, columns }) => {
          suggestions.push({ 
            label: table, 
            kind: monaco.languages.CompletionItemKind.Struct, 
            insertText: table, 
            detail: 'Table',
            range 
          });
          if (Array.isArray(columns)) {
            columns.forEach((col:any) => suggestions.push({
              label: col.column, 
              kind: monaco.languages.CompletionItemKind.Field,
              insertText: col.column, 
              detail: `Column in ${table} (${col.type})`,
              range
            }));
          }
        });

        return { suggestions };
      }
    });
  };

  useEffect(() => {
    if (schema) setupAutocomplete(schema);
  }, [monaco, schema]);

  const insertTable = (db: string|undefined, table: string) => {
    const q = db
      ? `SELECT TOP 100 * FROM [${db}].[dbo].[${table}];`   // mssql 3-part
      : `SELECT * FROM ${table} LIMIT 100;`;
    setQuery(q);
  };

  const executeQuery = async () => {
    let queryToRun = query;
    if (editorInstance) {
      const selection = editorInstance.getSelection();
      if (selection && !selection.isEmpty()) {
        queryToRun = editorInstance.getModel().getValueInRange(selection);
      }
    }

    if (!dbId || !queryToRun.trim()) return;
    setIsExecuting(true);
    setError(null);
    setResultSets(null);

    try {
      const res = await fetch(`/api/databases/${dbId}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryToRun })
      });
      const data = await res.json();

      if (res.ok) {
        // data.results is now an array of result sets (each result set is an array of rows)
        // Check if backend returned array of arrays, fallback gracefully if not
        const rs = data.results;
        if (Array.isArray(rs)) {
          if (rs.length > 0 && Array.isArray(rs[0])) {
            setResultSets(rs);
          } else if (rs.length > 0 && !Array.isArray(rs[0])) {
            setResultSets([rs]); // Wrap legacy single resultset
          } else {
            setResultSets([]);
          }
        } else {
          setResultSets([]);
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

  const copyAsJSON = (rows: any[]) => {
    if (!rows) return;
    navigator.clipboard.writeText(JSON.stringify(rows, null, 2));
  };

  const copyAsMarkdown = (rows: any[], cols: string[]) => {
    if (!rows || rows.length === 0) return;
    let md = `| ${cols.join(' | ')} |\n| ${cols.map(() => '---').join(' | ')} |\n`;
    rows.forEach(row => {
      md += `| ${cols.map(c => row[c] ?? 'NULL').join(' | ')} |\n`;
    });
    navigator.clipboard.writeText(md);
  };

  const copyAsText = (rows: any[], cols: string[]) => {
    if (!rows || rows.length === 0) return;
    let text = cols.join('\t') + '\n';
    rows.forEach(row => {
      text += cols.map(c => row[c] ?? 'NULL').join('\t') + '\n';
    });
    navigator.clipboard.writeText(text);
  };

  const copyHeaders = (cols: string[]) => {
    if (!cols || cols.length === 0) return;
    navigator.clipboard.writeText(cols.join(', '));
  };

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden font-sans">
      <PanelGroup direction="horizontal">
        
        {/* Schema Explorer Panel */}
        <Panel ref={schemaPanelRef} collapsible={true} defaultSize={20} minSize={15} maxSize={35}>
          <div className="h-full bg-[#111] border-r border-gray-800 flex flex-col">
            <div className="h-14 border-b border-gray-800 flex items-center px-4 gap-2">
              <Database className="w-4 h-4 text-indigo-400" />
              <span className="font-semibold text-gray-200 text-sm">Schema Explorer</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 text-sm custom-scrollbar">
              {schema?.__multiDb ? (
                Object.entries(schema.databases).map(([dbName, tables]: any) => (
                  <div key={dbName}>
                    <button onClick={() => setOpenDb(openDb===dbName?null:dbName)}
                      className="w-full text-left px-2 py-1.5 rounded hover:bg-gray-800 flex items-center gap-1 text-gray-200">
                      <span className="text-gray-500">{openDb===dbName?'▾':'▸'}</span>
                      <Database className="w-3.5 h-3.5 text-indigo-400" /> {dbName}
                      <span className="ml-auto text-xs text-gray-600">{Object.keys(tables).length}</span>
                    </button>
                    {openDb===dbName && (
                      <div className="ml-4 border-l border-gray-800">
                        {Object.entries(tables).map(([t, cols]: any) => (
                          <TableNode key={t} db={dbName} table={t} cols={cols}
                            open={openTable===`${dbName}.${t}`}
                            onToggle={() => setOpenTable(openTable===`${dbName}.${t}`?null:`${dbName}.${t}`)}
                            onInsert={() => insertTable(dbName, t)} />
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                schema && Object.entries(schema).map(([t, cols]: any) => (
                  <TableNode key={t} table={t} cols={cols}
                    open={openTable===t} onToggle={() => setOpenTable(openTable===t?null:t)}
                    onInsert={() => insertTable(undefined, t)} />
                ))
              )}
            </div>
          </div>
        </Panel>
        <PanelResizeHandle className="w-1.5 bg-gray-800 hover:bg-indigo-500 transition-colors" />

        {/* Middle Content: Editor & Terminal Split */}
        <Panel defaultSize={55} minSize={30}>
          <div className="flex h-full flex-col min-w-0">
            
            {/* Header Bar */}
            <div className="h-14 border-b border-gray-800 bg-[#111] flex items-center justify-between px-4 shrink-0">
              <div className="flex items-center gap-3">
                <Link href="/databases" className="text-gray-400 hover:text-white transition-colors" title="Back to Databases">
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <button 
                  onClick={() => {
                    const panel = schemaPanelRef.current;
                    if (panel) {
                      if (panel.isCollapsed()) panel.expand();
                      else panel.collapse();
                    }
                  }}
                  className="text-gray-400 hover:text-indigo-400 transition-colors p-1"
                  title="Toggle Schema Explorer"
                >
                  <Database className="w-5 h-5 text-indigo-500" />
                </button>
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
                      onMount={(editor) => setEditorInstance(editor)}
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
                    </div>
                    
                    <div className="flex-1 overflow-auto p-4 custom-scrollbar flex flex-col gap-8">
                      {error && (
                        <div className="text-red-400 font-mono text-sm bg-red-900/10 p-4 rounded border border-red-900/30">
                          {error}
                        </div>
                      )}
                      
                      {resultSets && resultSets.length === 0 && (
                        <div className="text-gray-500 italic text-sm">Query executed successfully. 0 results returned.</div>
                      )}
                      
                      {resultSets && resultSets.map((rows, setIndex) => {
                        const cols = rows.length > 0 ? Object.keys(rows[0]) : [];
                        return (
                          <div key={setIndex} className="flex flex-col gap-2">
                            <div className="flex items-center gap-3 bg-[#111] p-2 rounded border border-gray-800">
                               <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">Result Set {setIndex + 1}</span>
                               <span className="text-xs text-gray-500">{rows.length} rows</span>
                               <div className="ml-auto flex items-center gap-1">
                                  <button onClick={() => copyAsJSON(rows)} className="px-2 py-1 hover:bg-gray-800 rounded text-xs text-gray-400 hover:text-white transition-colors" title="Copy as JSON">JSON</button>
                                  <button onClick={() => copyAsMarkdown(rows, cols)} className="px-2 py-1 hover:bg-gray-800 rounded text-xs text-gray-400 hover:text-white transition-colors" title="Copy as Markdown table">MD</button>
                                  <button onClick={() => copyAsText(rows, cols)} className="px-2 py-1 hover:bg-gray-800 rounded text-xs text-gray-400 hover:text-white transition-colors" title="Copy as Tab-Separated Text">TXT</button>
                                  <button onClick={() => copyHeaders(cols)} className="px-2 py-1 hover:bg-gray-800 rounded text-xs text-gray-400 hover:text-white transition-colors" title="Copy Headers only">Headers</button>
                               </div>
                            </div>
                            
                            {rows.length === 0 ? (
                               <div className="text-gray-500 italic text-sm p-2">0 rows returned.</div>
                            ) : (
                              <div className="inline-block min-w-full overflow-hidden border border-gray-800 rounded bg-[#0a0a0a]">
                                <div className="overflow-x-auto custom-scrollbar">
                                  <table className="min-w-full text-left text-sm whitespace-nowrap">
                                    <thead className="border-b border-gray-800 bg-[#111]">
                                      <tr>
                                        {cols.map(col => (
                                          <th key={col} className="px-4 py-2 font-semibold text-gray-300">{col}</th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800/50 font-mono text-gray-400">
                                      {rows.map((row: any, i: number) => (
                                        <tr key={i} className="hover:bg-gray-800/20">
                                          {cols.map(col => (
                                            <td key={`${i}-${col}`} className="px-4 py-2">
                                              {row[col] !== null ? String(row[col]) : <span className="text-gray-600 italic">NULL</span>}
                                            </td>
                                          ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      
                      {!resultSets && !error && !isExecuting && (
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
