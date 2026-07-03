"use client";

import React, { useState, useEffect } from 'react';
import { Database, FileText, Bot, Search, PlusCircle, History, LayoutDashboard, Settings, Clock, CheckCircle, ChevronRight, X, Activity } from 'lucide-react';
import { BaseGenerationWizard } from './BaseGenerationWizard';
import { UniversalOutputViewer } from './UniversalOutputViewer';

export interface BaseGenerationCenterProps {
  moduleName: string;
  moduleDescription: string;
  wizardConfig: {
    steps: Array<{
      id: string;
      label: string;
      fields: Array<{
        name: string;
        label: string;
        type: 'select' | 'text' | 'number';
        options?: string[];
        placeholder?: string;
      }>;
    }>;
  };
  templates: Array<{
    id: string;
    name: string;
    description: string;
    icon: any;
    config: any;
  }>;
  sources: any[];
}

export function BaseGenerationCenter({
  moduleName,
  moduleDescription,
  wizardConfig,
  templates,
  sources
}: BaseGenerationCenterProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'generate' | 'history' | 'templates' | 'settings'>('dashboard');
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [activeOutputId, setActiveOutputId] = useState<number | null>(null);

  useEffect(() => {
    if (activeTab === 'dashboard' || activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  const fetchHistory = async () => {
    try {
      const res = await fetch(`/api/generation/history?module=${encodeURIComponent(moduleName)}`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
      }
    } catch (error) {
      console.error("Failed to fetch history", error);
    }
  };

  const startGenerating = (template?: any) => {
    setSelectedTemplate(template || null);
    setActiveTab('generate');
    setActiveOutputId(null);
  };

  const handleTabChange = (tab: 'dashboard' | 'generate' | 'history' | 'templates' | 'settings') => {
    setActiveTab(tab);
    setActiveOutputId(null);
  };

  return (
    <div className="flex flex-row flex-1 h-full min-h-0 border border-gray-800 rounded-2xl overflow-hidden bg-[#0a0a0a] shadow-xl relative print:border-none print:shadow-none print:bg-transparent print:rounded-none print:block print:overflow-visible">
      
      {/* Sidebar Navigation */}
      <div className="w-[280px] lg:w-[320px] border-r border-gray-800 bg-[#0a0a0a] flex flex-col shrink-0 overflow-y-auto print:hidden">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/20">
              <Bot className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">{moduleName}</h1>
              <p className="text-xs text-gray-500 line-clamp-2 mt-1">{moduleDescription}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-8 bg-[#111] p-3 rounded-xl border border-gray-800/50">
            <div className="flex flex-col items-center justify-center">
              <span className="text-white font-bold text-lg">{history.length}</span>
              <span className="text-[10px] text-gray-500 font-medium uppercase mt-0.5">Runs</span>
            </div>
            <div className="flex flex-col items-center justify-center border-l border-r border-gray-800/80">
              <span className="text-white font-bold text-lg">{history.reduce((acc, h) => acc + h.creditsUsed, 0)}</span>
              <span className="text-[10px] text-gray-500 font-medium uppercase mt-0.5">Saved</span>
            </div>
            <div className="flex flex-col items-center justify-center">
              <span className="text-white font-bold text-lg">{(history.length * 1.2).toFixed(1)}M</span>
              <span className="text-[10px] text-gray-500 font-medium uppercase mt-0.5">Tokens</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => handleTabChange('dashboard')}
              className={`p-3 rounded-xl text-sm font-medium flex items-center gap-3 transition-colors ${
                activeTab === 'dashboard' || activeTab === 'history' ? 'bg-[#1a1a1a] text-white border border-gray-700 shadow-sm' : 'text-gray-400 hover:text-gray-200 hover:bg-[#111] border border-transparent'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </button>
            <button
              onClick={() => startGenerating()}
              className={`p-3 rounded-xl text-sm font-medium flex items-center gap-3 transition-colors ${
                activeTab === 'generate' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-gray-400 hover:text-gray-200 hover:bg-[#111] border border-transparent'
              }`}
            >
              <PlusCircle className="w-4 h-4" /> Generate New
            </button>
            {/* Templates tab removed per request */}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 bg-[#111] overflow-y-auto relative no-scrollbar print:hidden">
        <div className="p-8 w-full">
          
          {(activeTab === 'dashboard' || activeTab === 'history') && (
            <div className="flex flex-col gap-8 animate-in fade-in duration-300">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-white font-bold text-xl">
                    <Bot className="w-5 h-5 text-indigo-400" /> Generated {moduleName.replace('Center', '')}
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    {history.length} documents · synced from your knowledge sources
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text" 
                      placeholder="Filter notes..." 
                      className="bg-[#1a1a1a] border border-gray-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 w-64 transition-colors"
                    />
                  </div>
                  <button 
                    onClick={() => startGenerating()}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2.5 px-5 rounded-xl flex items-center gap-2 transition-colors shadow-lg shadow-indigo-500/20"
                  >
                    <PlusCircle className="w-4 h-4" /> Generate
                  </button>
                </div>
              </div>

              {/* Cards Grid */}
              {history.length === 0 ? (
                <div className="text-gray-500 bg-[#1a1a1a] border border-gray-800 rounded-xl p-12 flex flex-col items-center justify-center">
                  <Activity className="w-8 h-8 text-gray-600 mb-4" />
                  <p>No activity yet. Click Generate to create your first output.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {history.map(item => (
                    <div key={item.id} className="relative rounded-2xl overflow-hidden bg-[#1a1a1a] border border-gray-800 hover:border-gray-700 transition-all flex flex-col group shadow-lg cursor-default">
                      {/* Gradient Top Half */}
                      <div className="h-36 bg-gradient-to-br from-indigo-500/90 via-blue-600/80 to-purple-600/90 p-5 relative overflow-hidden shrink-0">
                        {/* Background pattern overlay could go here */}
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                        
                        <div className="relative z-10 flex justify-between items-start">
                          <div className="bg-black/30 backdrop-blur-md text-white/90 text-[11px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5 border border-white/10">
                            <FileText className="w-3 h-3" /> PDF
                          </div>
                          <div className="bg-black/30 backdrop-blur-md text-white/90 text-[11px] font-bold px-3 py-1 rounded-full border border-white/10 shadow-sm">
                            {item.template}
                          </div>
                        </div>
                        <div className="relative z-10 mt-6 text-white font-bold text-xl line-clamp-2 leading-tight drop-shadow-md">
                          {item.title}
                        </div>
                      </div>
                      
                      {/* Bottom Half */}
                      <div className="bg-[#1a1a1a] p-5 flex flex-col flex-1 justify-between">
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span className="font-medium text-gray-300">General</span>
                          <span className="flex items-center"><Clock className="w-3 h-3 mr-1"/> {new Date(item.createdAt).toLocaleDateString()}</span>
                          <span className="flex items-center">{item.creditsUsed}p</span>
                        </div>
                        <div className="flex items-center gap-2 mt-4 pt-1">
                          <button 
                            onClick={() => setActiveOutputId(item.id)}
                            className="flex-1 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 hover:from-indigo-500/30 hover:to-purple-500/30 text-indigo-300 font-bold py-2.5 rounded-xl flex justify-center items-center gap-2 transition-all border border-indigo-500/30"
                          >
                            <Search className="w-4 h-4"/> View
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'generate' && (
            <div className="animate-in fade-in duration-300">
              <BaseGenerationWizard 
                moduleName={moduleName} 
                wizardConfig={wizardConfig} 
                templates={templates}
                initialTemplate={selectedTemplate}
                sources={sources}
                onComplete={() => setActiveTab('dashboard')}
              />
            </div>
          )}



        </div>
      </div>

      {/* Modal Popup Overlay for Viewer */}
      {activeOutputId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-8 animate-in fade-in duration-200 print:relative print:inset-auto print:bg-transparent print:p-0 print:block">
          <div className="bg-[#0a0a0a] border border-gray-800 rounded-2xl w-full max-w-6xl h-full shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 relative print:border-none print:shadow-none print:rounded-none print:bg-transparent print:block print:h-auto">
            <button 
              onClick={() => setActiveOutputId(null)}
              className="absolute top-4 right-4 z-50 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-md transition-colors print:hidden"
            >
              <X className="w-5 h-5" />
            </button>
            <UniversalOutputViewer outputId={activeOutputId} onBack={() => setActiveOutputId(null)} />
          </div>
        </div>
      )}

    </div>
  );
}
