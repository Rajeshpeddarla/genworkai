"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RefreshCcw, FileText, Database, Clock4, PlayCircle, ExternalLink, Download, Copy, Check, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';

export function DetailsDrawer({ isOpen, onClose, taskId, automations, databases, onEdit }: any) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const automation = automations.find((a: any) => a.id === taskId);
  const db = databases.find((d: any) => d.id.toString() === automation?.sources?.[0]?.id?.toString());

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isOpen && taskId) {
      fetchHistory();
      interval = setInterval(() => {
        fetchHistory();
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, taskId]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/automation/database/${taskId}/history`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteLog = async (logId: number) => {
    if (!confirm('Are you sure you want to delete this execution log and its generated data?')) return;
    try {
      const res = await fetch(`/api/automation/database/${taskId}/history/${logId}`, { method: 'DELETE' });
      if (res.ok) {
        setHistory(prev => prev.filter(h => h.id !== logId));
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!automation) return null;

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
            className="fixed right-0 top-0 bottom-0 w-[55%] min-w-[600px] bg-[#0f0f0f] border-l border-gray-800 z-50 flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-800 shrink-0 bg-[#0a0a0a]">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  {automation.name}
                  <span className={`px-2 py-0.5 rounded text-xs font-bold border capitalize ${
                    automation.status === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                    automation.status === 'paused' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                    automation.status === 'running' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                    'bg-gray-500/10 text-gray-400 border-gray-500/20'
                  }`}>
                    {automation.status}
                  </span>
                </h2>
                <p className="text-sm text-gray-400 mt-1">{automation.description || 'No description provided.'}</p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => onEdit(taskId)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium text-sm"
                >
                  Edit
                </button>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors ml-2"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
              {/* Overview Grid */}
              <div className="p-6 grid grid-cols-2 lg:grid-cols-4 gap-4 border-b border-gray-800 bg-[#111]">
                <div>
                  <div className="text-xs text-gray-500 flex items-center gap-1 mb-1"><Database className="w-3 h-3" /> Database</div>
                  <div className="text-sm font-medium text-white">{db?.databaseName || 'Unknown'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 flex items-center gap-1 mb-1"><Clock4 className="w-3 h-3" /> Schedule</div>
                  <div className="text-sm font-medium text-white capitalize">{automation.schedule || 'Manual'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 flex items-center gap-1 mb-1"><PlayCircle className="w-3 h-3" /> Total Runs</div>
                  <div className="text-sm font-medium text-white">{automation.totalRuns || 0}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 flex items-center gap-1 mb-1"><Clock4 className="w-3 h-3" /> Created</div>
                  <div className="text-sm font-medium text-white">{new Date(automation.createdAt).toLocaleDateString()}</div>
                </div>
              </div>

              {/* History Section */}
              <div className="p-6 flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-white text-lg">Execution History</h3>
                  <button onClick={fetchHistory} className="text-gray-400 hover:text-white transition-colors">
                    <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  {history.map((log) => (
                    <div key={log.id} className="bg-[#151515] border border-gray-800 rounded-xl overflow-hidden flex flex-col">
                      <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-[#111]">
                        <div className="flex items-center gap-4">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                            log.status === 'success' ? 'bg-green-500/20 text-green-400' : 
                            log.status === 'failed' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            {log.status.toUpperCase()}
                          </span>
                          <span className="text-sm text-gray-400 font-medium">
                            {new Date(log.startedAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex gap-4 items-center text-xs text-gray-500 font-medium">
                          <span>Duration: {log.durationMs ? `${(log.durationMs / 1000).toFixed(1)}s` : '-'}</span>
                          {log.artifactId && <span>Generated: {log.artifactTitle || 'Report'}</span>}
                          <button 
                            onClick={() => handleDeleteLog(log.id)}
                            className="text-gray-600 hover:text-red-400 transition-colors ml-2"
                            title="Delete this execution log"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {log.errorDetails && (
                        <div className="p-4 bg-red-900/10 border-b border-red-900/20 text-red-400 text-sm font-mono whitespace-pre-wrap">
                          {log.errorDetails}
                        </div>
                      )}

                      {log.artifactContent && (
                        <div className="flex-1 flex flex-col">
                          <div className="px-4 py-2 bg-[#1a1a1a] border-b border-gray-800 flex items-center justify-between text-xs">
                            <span className="text-gray-400 font-medium flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Generated Artifact</span>
                            <div className="flex items-center gap-3">
                              <button onClick={() => handleCopy(log.artifactContent)} className="text-gray-400 hover:text-white transition-colors flex items-center gap-1">
                                {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />} {copied ? 'Copied' : 'Copy'}
                              </button>
                              <Link href={`/workspace/artifact/${log.artifactId}`} target="_blank" className="text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1">
                                <ExternalLink className="w-3.5 h-3.5" /> Open in Workspace
                              </Link>
                            </div>
                          </div>
                          <div className="p-6 bg-[#0a0a0a] text-gray-300 prose prose-invert prose-sm max-w-none prose-headings:text-indigo-400 prose-a:text-indigo-400">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{log.artifactContent}</ReactMarkdown>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {history.length === 0 && !loading && (
                    <div className="text-center text-gray-500 text-sm py-12 flex flex-col items-center">
                      <Clock4 className="w-8 h-8 mb-3 opacity-20" />
                      No execution history yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
