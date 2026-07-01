"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, Copy, History, Sparkles, AlertTriangle } from 'lucide-react';
import { FlashcardRenderer } from './renderers/FlashcardRenderer';
import { StudyNotesRenderer } from './renderers/StudyNotesRenderer';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function UniversalOutputViewer({ outputId, onBack }: { outputId: number, onBack: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [activeVersionId, setActiveVersionId] = useState<number | null>(null);

  useEffect(() => {
    async function fetchOutput() {
      try {
        const res = await fetch(`/api/generation/outputs/${outputId}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        setData(json);
        if (json.versions && json.versions.length > 0) {
          setActiveVersionId(json.versions[0].id);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchOutput();
  }, [outputId]);

  if (loading) return <div className="p-12 text-center text-gray-500 animate-pulse">Loading Output...</div>;
  if (error) return <div className="p-12 text-center text-red-500">{error}</div>;
  if (!data) return null;

  const activeVersion = data.versions.find((v: any) => v.id === activeVersionId) || data.versions[0];

  let parsedContent = null;
  try {
    parsedContent = JSON.parse(activeVersion.content);
  } catch (e) {
    parsedContent = activeVersion.content;
  }

  const renderContent = () => {
    if (activeVersion.format === 'flashcards_v1') {
      return <FlashcardRenderer data={parsedContent} />;
    }
    if (activeVersion.format === 'study_notes_v1') {
      return <StudyNotesRenderer data={parsedContent} />;
    }
    // Fallback renderer for markdown or unknown JSON
    if (typeof parsedContent === 'object') {
      return (
        <pre className="bg-[#111] p-6 rounded-xl border border-gray-800 text-green-400 overflow-auto">
          {JSON.stringify(parsedContent, null, 2)}
        </pre>
      );
    }
    return (
      <div className="prose prose-invert prose-indigo max-w-none text-gray-300">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{typeof parsedContent === 'string' ? parsedContent : JSON.stringify(parsedContent)}</ReactMarkdown>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      {/* Header Bar */}
      <div className="border-b border-gray-800 bg-[#111] p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-white">{data.output.title}</h2>
            <div className="text-xs text-gray-500 flex gap-2">
              <span>{data.output.module}</span> • <span>{data.output.template}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => alert('Duplication will be available in a future update!')}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Copy className="w-4 h-4" /> Duplicate
          </button>
          <button 
            onClick={() => {
              const contentToExport = typeof parsedContent === 'object' ? JSON.stringify(parsedContent, null, 2) : activeVersion.content;
              const blob = new Blob([contentToExport], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${data.output.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" /> Export
          </button>
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${showHistory ? 'bg-indigo-500/20 text-indigo-400' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
          >
            <History className="w-4 h-4" /> Versions
          </button>
          <button 
            onClick={() => alert('AI Edit Actions are coming soon!')}
            className="flex items-center gap-2 px-4 py-1.5 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            <Sparkles className="w-4 h-4" /> AI Actions
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Render Area */}
        <div className="flex-1 overflow-y-auto p-8 relative">
          {renderContent()}
        </div>

        {/* Optional History Sidebar */}
        {showHistory && (
          <div className="w-80 border-l border-gray-800 bg-[#111] overflow-y-auto shrink-0 p-4">
            <h3 className="font-bold text-white mb-4">Version History</h3>
            <div className="space-y-3">
              {data.versions.map((v: any) => (
                <div 
                  key={v.id} 
                  onClick={() => setActiveVersionId(v.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-colors ${activeVersionId === v.id ? 'bg-indigo-500/10 border-indigo-500/50' : 'bg-[#1a1a1a] border-gray-800 hover:border-gray-700'}`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-sm text-white">v{v.versionNumber}</span>
                    <span className="text-xs text-gray-500">{new Date(v.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-xs text-gray-400">Format: {v.format}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
