"use client";

import { useState, useEffect } from "react";
import { TerminalSquare, ChevronDown, ChevronUp, Loader2, Clock, Calendar, CheckCircle2, XCircle } from "lucide-react";

interface RequestLog {
  id: string;
  user_id: string;
  file_name: string;
  status: string;
  execution_time_ms: number;
  request_metadata: any;
  created_at: string;
}

export function RequestLogsTable() {
  const [logs, setLogs] = useState<RequestLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/logs");
      const data = await res.json();
      if (data.logs) {
        setLogs(data.logs);
      }
    } catch (e) {
      console.error("Failed to fetch logs", e);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).format(date);
  };

  return (
    <div className="mt-12 bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
      <div className="border-b border-zinc-200 bg-zinc-50/50 p-6">
        <h2 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
          <TerminalSquare className="w-5 h-5 text-zinc-500" />
          Request Logs
        </h2>
        <p className="text-zinc-500 text-sm mt-1">Monitor your Document Intelligence API executions in real-time.</p>
      </div>
      
      <div className="p-0">
        {loading ? (
          <div className="flex items-center justify-center p-12 text-zinc-500">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Loading logs...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">
            No API requests found yet. Upload a document to see logs here.
          </div>
        ) : (
          <div className="divide-y divide-zinc-200">
            {logs.map((log) => (
              <div key={log.id} className="flex flex-col">
                <div 
                  className="flex items-center justify-between p-4 hover:bg-zinc-50 cursor-pointer transition-colors"
                  onClick={() => toggleExpand(log.id)}
                >
                  <div className="flex items-center gap-6 flex-1">
                    <div className="flex items-center gap-2 min-w-[140px]">
                      {log.status === 'success' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                      <span className="text-sm font-medium text-zinc-900">
                        {log.status === 'success' ? '200 OK' : '400 Error'}
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-zinc-900">{log.file_name || 'Unknown File'}</span>
                      <span className="text-xs text-zinc-500 font-mono">User ID: {log.user_id.substring(0,8)}...</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="flex items-center gap-1.5 text-sm text-zinc-600">
                      <Clock className="w-4 h-4 text-zinc-400" />
                      {log.execution_time_ms}ms
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-zinc-600 min-w-[160px]">
                      <Calendar className="w-4 h-4 text-zinc-400" />
                      {formatDate(log.created_at)}
                    </div>
                    <button className="p-1 text-zinc-400 hover:text-zinc-600">
                      {expandedLogId === log.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                
                {expandedLogId === log.id && (
                  <div className="bg-zinc-900 p-4 border-t border-zinc-200">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Full Debug Log</span>
                    </div>
                    <pre className="text-xs text-zinc-300 font-mono overflow-auto max-h-[400px] custom-scrollbar">
                      {JSON.stringify(log.request_metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
