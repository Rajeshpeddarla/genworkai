"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Bot, PlayCircle, Plus, Send, Zap, Activity, CheckCircle, Database, FileText, Settings, ArrowDown } from 'lucide-react';

export function AutomationBuilder({ 
  sources, 
  onClose,
  onActivate,
  initialPrompt
}: { 
  sources: any[], 
  onClose: () => void,
  onActivate: () => void,
  initialPrompt?: string
}) {
  const [prompt, setPrompt] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<any>(null);
  const [runningTest, setRunningTest] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [selectedSource, setSelectedSource] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom() }, [chatHistory]);

  const handleSendRef = useRef<(p?: string | any) => void>(() => {});

  useEffect(() => {
    if (initialPrompt && !prompt && chatHistory.length === 0) {
      setPrompt(initialPrompt);
    }
  }, [initialPrompt, prompt, chatHistory]);

  useEffect(() => {
    handleSendRef.current = handleSend;
  });

  const handleSend = async (overridePrompt?: string | any) => {
    // If called from an event handler, overridePrompt might be an Event.
    const textToSend = typeof overridePrompt === 'string' ? overridePrompt : prompt;
    if (!textToSend.trim()) return;
    const userMsg = { role: 'user' as const, content: textToSend };
    const newHistory = [...chatHistory, userMsg];
    setChatHistory(newHistory);
    setPrompt('');
    setLoading(true);

    try {
      // Find if they mentioned a specific source in natural language as a quick hack
      // Real app might use RAG, but here we just pass a default or inferred source if any
      const res = await fetch('/api/automation/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: newHistory,
          currentPlan: plan,
          sourceType: selectedSource ? (selectedSource.type === 'database' ? 'db' : 'kb') : (sources.length > 0 ? (sources[0].type === 'database' ? 'db' : 'kb') : 'kb'), 
          sourceId: selectedSource ? selectedSource.internalId : (sources.length > 0 ? sources[0].internalId : null)
        })
      });

      if (!res.ok) throw new Error('Failed to generate plan');
      const data = await res.json();

      if (data.isReady) {
        setPlan(data);
        setChatHistory(prev => [...prev, { role: 'assistant', content: `Great! I've generated an automation plan for you. Review the visual workflow and estimations on the right.` }]);
      } else {
        setChatHistory(prev => [...prev, { role: 'assistant', content: data.followUpQuestion || "Could you clarify what you'd like to do?" }]);
      }
    } catch (e) {
      setChatHistory(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleTestRun = async () => {
    setRunningTest(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/automation/test-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: plan.name,
          goal: plan.goal,
          category: plan.sql ? 'database' : 'workspace', // fallback
          artifactTypes: plan.artifactTypes,
          sqlQuery: plan.sql,
          sources: selectedSource ? [{ id: selectedSource.internalId }] : (sources.length > 0 ? [{ id: sources[0].internalId }] : [])
        })
      });
      const data = await res.json();
      setTestResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setRunningTest(false);
    }
  };

  const handleActivate = async () => {
    try {
      const res = await fetch('/api/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: plan.name,
          description: plan.description,
          category: 'ai_agent',
          templateId: 'ai_generated',
          sources: [], // In MVP, assume source mapped
          artifactTypes: plan.artifactTypes || ['document'],
          executionMode: plan.schedule ? 'scheduled' : 'manual',
          schedule: plan.schedule || '',
          triggerEvent: plan.trigger || '',
          goal: plan.goal,
          sqlQuery: plan.sql,
          aiProvider: plan.provider || 'DeepSeek',
          billingMode: plan.billingMode || 'platform'
        })
      });
      if (res.ok) {
        onActivate();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-[#0a0a0a] border border-gray-800 rounded-2xl w-full max-w-7xl h-[90vh] shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-[#111]">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500/20 p-2 rounded-lg">
              <Bot className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">AI Agent Builder</h2>
              <p className="text-xs text-gray-400">Describe what you want, and I'll build it.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-2 hover:bg-gray-800 rounded-lg">
            X
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel: Chat Interface */}
          <div className="w-1/2 flex flex-col border-r border-gray-800">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {chatHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto">
                  <Bot className="w-12 h-12 text-gray-600 mb-4 opacity-50" />
                  
                  {!selectedSource ? (
                    <>
                      <h3 className="text-xl font-medium mb-2 text-gray-300">Select a Source</h3>
                      <p className="text-sm text-gray-500 mb-8">Which knowledge base or database should this automation use?</p>
                      
                      <div className="w-full space-y-2 text-left max-h-[300px] overflow-y-auto pr-2">
                        {sources.filter(s => s.type === 'knowledge_base' || s.type === 'database').map(src => (
                          <button 
                            key={src.id} 
                            onClick={() => setSelectedSource(src)} 
                            className="w-full p-3 bg-[#111] hover:bg-gray-800 border border-gray-800 rounded-lg text-sm text-gray-300 transition-colors text-left flex items-center gap-3"
                          >
                            {src.type === 'database' ? <Database className="w-4 h-4 text-indigo-400" /> : <Database className="w-4 h-4 text-green-400" />}
                            {src.name}
                          </button>
                        ))}
                        {sources.length === 0 && (
                          <div className="text-center text-gray-500 text-sm py-4">No sources available. Create a Knowledge Base first.</div>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="text-xl font-medium mb-2 text-gray-300">Describe your automation</h3>
                      <p className="text-sm text-gray-500 mb-8">
                        Using <span className="font-bold text-indigo-400">{selectedSource.name}</span>. What topic or specific files should we focus on?
                      </p>
                      
                      <div className="w-full space-y-2 text-left">
                        <p className="text-xs text-gray-600 font-bold uppercase tracking-wider mb-3">Templates</p>
                        <button onClick={() => setPrompt(`Every Monday summarize my knowledge base into a PDF.`)} className="w-full p-3 bg-[#111] hover:bg-gray-800 border border-gray-800 rounded-lg text-sm text-gray-300 transition-colors text-left flex items-center gap-3">
                          <FileText className="w-4 h-4 text-indigo-400" /> Weekly Knowledge Summary
                        </button>
                        <button onClick={() => setPrompt(`Generate a 10-question quiz about the core concepts.`)} className="w-full p-3 bg-[#111] hover:bg-gray-800 border border-gray-800 rounded-lg text-sm text-gray-300 transition-colors text-left flex items-center gap-3">
                          <CheckCircle className="w-4 h-4 text-green-400" /> Generate Quiz
                        </button>
                        <button onClick={() => setSelectedSource(null)} className="w-full p-2 mt-4 text-center text-xs text-gray-500 hover:text-white transition-colors">
                          ← Change Source
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-4 pb-4">
                  {chatHistory.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-4 rounded-2xl ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-[#1a1a1a] border border-gray-800 text-gray-200 rounded-tl-none'}`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-[#1a1a1a] border border-gray-800 p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-75"></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-150"></div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
            
            <div className={`p-4 bg-[#111] border-t border-gray-800 transition-opacity ${!selectedSource && chatHistory.length === 0 ? 'opacity-30 pointer-events-none' : ''}`}>
              <div className="relative flex items-center">
                <input 
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={!selectedSource && chatHistory.length === 0 ? "Please select a source first..." : "E.g. Send a daily summary of new user signups..."}
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded-xl pl-4 pr-12 py-4 text-sm text-white focus:outline-none focus:border-indigo-500 shadow-inner"
                />
                <button 
                  onClick={handleSend}
                  disabled={!prompt.trim() || loading}
                  className="absolute right-2 p-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 rounded-lg transition-colors"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel: Workflow & Estimations */}
          <div className="w-1/2 bg-[#111] overflow-y-auto">
            {!plan ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-24 h-24 rounded-full border border-dashed border-gray-700 flex items-center justify-center mb-6">
                  <Activity className="w-8 h-8 text-gray-600 opacity-30" />
                </div>
                <h3 className="text-lg font-medium text-gray-400">Waiting for Plan</h3>
                <p className="text-sm text-gray-600 mt-2 max-w-sm">Once the AI understands your goal, it will generate a visual workflow and cost estimation here.</p>
              </div>
            ) : (
              <div className="p-8 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                
                {/* Header Info */}
                <div>
                  <h2 className="text-2xl font-bold">{plan.name}</h2>
                  <p className="text-gray-400 mt-1">{plan.description}</p>
                </div>

                {/* Workflow Visualization */}
                <div>
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Workflow Details</h3>
                  <div className="flex flex-col items-center space-y-2">
                    {plan.workflowSteps && plan.workflowSteps.length > 0 ? (
                      plan.workflowSteps.map((step: any, idx: number) => (
                        <React.Fragment key={step.id || idx}>
                          <div className="w-full max-w-md bg-[#1a1a1a] border border-gray-700 rounded-xl p-4 flex items-center gap-4 hover:border-indigo-500 transition-colors cursor-pointer group">
                            <div className="bg-gray-800 p-3 rounded-lg group-hover:bg-indigo-500/20 transition-colors">
                              {step.type === 'source' ? <Database className="w-5 h-5 text-indigo-400" /> : 
                               step.type === 'action' ? <Settings className="w-5 h-5 text-orange-400" /> :
                               step.type === 'schedule' ? <Activity className="w-5 h-5 text-green-400" /> :
                               <FileText className="w-5 h-5 text-blue-400" />}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-gray-200">{step.label}</h4>
                              {step.details && <p className="text-xs text-gray-400 mt-1 line-clamp-1">{step.details}</p>}
                            </div>
                          </div>
                          {idx < plan.workflowSteps.length - 1 && (
                            <ArrowDown className="w-5 h-5 text-gray-600 my-1" />
                          )}
                        </React.Fragment>
                      ))
                    ) : (
                      // Fallback nodes if AI didn't return steps
                      <>
                        <div className="w-full max-w-md bg-[#1a1a1a] border border-gray-700 rounded-xl p-4 flex items-center gap-4">
                          <Database className="w-5 h-5 text-indigo-400" />
                          <div><h4 className="font-bold">Source</h4><p className="text-xs text-gray-400">{plan.source || 'Auto-detected'}</p></div>
                        </div>
                        <ArrowDown className="w-5 h-5 text-gray-600 my-1" />
                        <div className="w-full max-w-md bg-[#1a1a1a] border border-gray-700 rounded-xl p-4 flex items-center gap-4">
                          <Settings className="w-5 h-5 text-orange-400" />
                          <div><h4 className="font-bold">Goal / Action</h4><p className="text-xs text-gray-400 line-clamp-1">{plan.goal}</p></div>
                        </div>
                        <ArrowDown className="w-5 h-5 text-gray-600 my-1" />
                        <div className="w-full max-w-md bg-[#1a1a1a] border border-gray-700 rounded-xl p-4 flex items-center gap-4">
                          <Activity className="w-5 h-5 text-green-400" />
                          <div><h4 className="font-bold">Schedule</h4><p className="text-xs text-gray-400">{plan.schedule || 'Manual'}</p></div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* AI Plan Estimations */}
                <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-5">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Estimations & Info</h3>
                  <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                    <div>
                      <span className="text-gray-500 block mb-1">Provider</span>
                      <span className="font-semibold text-gray-200">{plan.provider || 'Platform AI'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block mb-1">Billing Mode</span>
                      <span className="font-semibold text-indigo-400 uppercase tracking-wider text-xs px-2 py-0.5 bg-indigo-500/10 rounded-full inline-block">{plan.billingMode === 'byok' ? 'Using Your API Key' : 'Platform AI Credits'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block mb-1">Estimated Credits/Run</span>
                      <span className="font-semibold text-gray-200">{plan.billingMode === 'byok' ? '0 (BYOK)' : (plan.estimatedCredits || 3)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block mb-1">Estimated Monthly Runs</span>
                      <span className="font-semibold text-gray-200">{plan.runsPerMonth || 1}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block mb-1">Estimated Monthly Cost</span>
                      <span className="font-semibold text-gray-200">{plan.billingMode === 'byok' ? '0 Credits' : `${(plan.estimatedCredits || 3) * (plan.runsPerMonth || 1)} Credits`}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block mb-1">Estimated Runtime</span>
                      <span className="font-semibold text-gray-200">{plan.estimatedRuntime || '~15s'}</span>
                    </div>
                  </div>
                </div>

                {/* Test Run & Activate */}
                <div className="pt-4 flex flex-col gap-3">
                  {testResult && (
                    <div className="p-4 bg-green-900/20 border border-green-800/50 rounded-xl text-sm mb-2">
                      <div className="font-bold text-green-400 flex items-center gap-2 mb-2"><CheckCircle className="w-4 h-4"/> Test Run Successful</div>
                      <p className="text-gray-300 line-clamp-3">{testResult.generatedContent}</p>
                      <div className="mt-3 text-xs text-gray-500">Execution Time: {testResult.executionTimeMs}ms • Credits Consumed: {testResult.creditsConsumed}</div>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <button 
                      onClick={handleTestRun}
                      disabled={runningTest}
                      className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    >
                      {runningTest ? <Activity className="w-5 h-5 animate-spin" /> : <PlayCircle className="w-5 h-5" />}
                      {runningTest ? 'Running...' : 'Run Once (Preview)'}
                    </button>
                    
                    <button 
                      onClick={handleActivate}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-[0_0_20px_rgba(79,70,229,0.3)]"
                    >
                      <Zap className="w-5 h-5" /> Activate Automation
                    </button>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
