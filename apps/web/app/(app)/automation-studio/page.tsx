"use client";

import React, { useState, useEffect } from 'react';
import { Bot, Plus, Zap, FileText, Database, Code, PlayCircle, X, Activity, Server, Clock, CheckCircle, XCircle, File, History, BarChart, Copy } from 'lucide-react';
import { AUTOMATION_TEMPLATES, AutomationTemplate } from '../../../lib/automation/templates';

type Tab = 'active' | 'scheduled' | 'artifacts' | 'monitoring' | 'history';

export default function AutomationStudio() {
  const [activeTab, setActiveTab] = useState<Tab>('active');
  const [tasks, setTasks] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Wizard State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [newTask, setNewTask] = useState<any>({
    name: '',
    description: '',
    category: '',
    templateId: '',
    sources: [],
    artifactTypes: [],
    executionMode: 'manual',
    schedule: '',
    triggerEvent: '',
    goal: ''
  });

  const fetchData = async () => {
    try {
      const [tasksRes, sourcesRes] = await Promise.all([
        fetch('/api/automation'),
        fetch('/api/automation/sources')
      ]);
      
      if (tasksRes.ok) setTasks(await tasksRes.json());
      if (sourcesRes.ok) {
        const sData = await sourcesRes.json();
        setSources(sData.sources || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateTask = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask)
      });
      if (res.ok) {
        await fetchData();
        closeWizard();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create task');
      }
    } catch (e) {
      alert('Network error');
    } finally {
      setSaving(false);
    }
  };

  const closeWizard = () => {
    setIsModalOpen(false);
    setWizardStep(1);
    setNewTask({
      name: '', description: '', category: '', templateId: '', 
      sources: [], artifactTypes: [], executionMode: 'manual', 
      schedule: '', triggerEvent: '', goal: ''
    });
  };

  const handleClone = (task: any) => {
    setNewTask({
      name: `Copy of ${task.name}`,
      description: task.description,
      category: task.category,
      templateId: task.templateId,
      sources: task.sources || [],
      artifactTypes: task.artifactTypes || [],
      executionMode: task.executionMode,
      schedule: task.schedule,
      triggerEvent: task.triggerEvent,
      goal: task.goal
    });
    setWizardStep(1);
    setIsModalOpen(true);
  };

  const handleRunNow = async (taskId: number) => {
    // In a real app we'd hit a dedicated /api/automation/run endpoint.
    // Since POST /api/automation creates it, we'd need a specific endpoint to just run an existing one.
    // For MVP frontend we can mock success or call an endpoint if we build it.
    alert(`Triggered run for Task ID: ${taskId}`);
  };

  // Stats calculation
  const totalAutomations = tasks.length;
  const runningAutomations = tasks.filter(t => t.status === 'running').length;
  const scheduledTasks = tasks.filter(t => t.executionMode === 'scheduled');
  
  return (
    <div className="p-8 max-w-7xl mx-auto w-full min-h-screen text-white bg-[#0a0a0a]">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Automation Studio</h1>
          <p className="text-gray-400 mt-2">Enterprise execution engine for generating workspace artifacts.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium">
          <Plus className="w-5 h-5" />
          Create Automation
        </button>
      </div>

      {/* Enterprise Monitoring Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-[#111] border border-gray-800 p-4 rounded-xl">
          <div className="text-gray-400 text-sm mb-1 flex justify-between"><span className="flex items-center gap-1"><Server className="w-4 h-4"/> Total</span></div>
          <div className="text-2xl font-bold">{totalAutomations}</div>
        </div>
        <div className="bg-[#111] border border-indigo-900/50 p-4 rounded-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-indigo-500/5 animate-pulse"></div>
          <div className="text-indigo-400 text-sm mb-1 flex justify-between relative"><span className="flex items-center gap-1"><Activity className="w-4 h-4"/> Running</span></div>
          <div className="text-2xl font-bold text-indigo-400 relative">{runningAutomations}</div>
        </div>
        <div className="bg-[#111] border border-green-900/30 p-4 rounded-xl">
          <div className="text-green-400 text-sm mb-1 flex justify-between"><span className="flex items-center gap-1"><CheckCircle className="w-4 h-4"/> Success Rate</span></div>
          <div className="text-2xl font-bold text-green-400">N/A</div>
        </div>
        <div className="bg-[#111] border border-red-900/30 p-4 rounded-xl">
          <div className="text-red-400 text-sm mb-1 flex justify-between"><span className="flex items-center gap-1"><XCircle className="w-4 h-4"/> Failed Runs</span></div>
          <div className="text-2xl font-bold text-red-400">0</div>
        </div>
        <div className="bg-[#111] border border-gray-800 p-4 rounded-xl">
          <div className="text-gray-400 text-sm mb-1 flex justify-between"><span className="flex items-center gap-1"><File className="w-4 h-4"/> Artifacts Generated</span></div>
          <div className="text-2xl font-bold">0</div>
        </div>
        <div className="bg-[#111] border border-gray-800 p-4 rounded-xl">
          <div className="text-gray-400 text-sm mb-1 flex justify-between"><span className="flex items-center gap-1"><Clock className="w-4 h-4"/> Next Execution</span></div>
          <div className="text-xl font-bold text-gray-500 truncate">None</div>
        </div>
      </div>

      <div className="flex gap-6 mb-6 border-b border-gray-800 pb-0 overflow-x-auto no-scrollbar">
        {[
          { id: 'active', label: 'Active Automations', icon: <Zap className="w-4 h-4" /> },
          { id: 'scheduled', label: 'Scheduled Automations', icon: <Clock className="w-4 h-4" /> },
          { id: 'artifacts', label: 'Generated Artifacts', icon: <FileText className="w-4 h-4" /> },
          { id: 'monitoring', label: 'Monitoring', icon: <BarChart className="w-4 h-4" /> },
          { id: 'history', label: 'History', icon: <History className="w-4 h-4" /> },
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={`px-1 py-3 flex items-center gap-2 font-medium transition-colors ${activeTab === tab.id ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-gray-300'}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Activity className="w-8 h-8 text-indigo-500 animate-spin" /></div>
      ) : activeTab === 'active' || activeTab === 'scheduled' ? (
        <div className="space-y-4">
          {tasks.filter(t => activeTab === 'active' ? t.status === 'active' || t.status === 'running' : t.executionMode === 'scheduled').length === 0 ? (
             <div className="text-center py-16 text-gray-500 bg-[#111] rounded-xl border border-gray-800/50">
               No {activeTab} automations found.
             </div>
          ) : (
            tasks.filter(t => activeTab === 'active' ? t.status === 'active' || t.status === 'running' : t.executionMode === 'scheduled').map(task => (
              <div key={task.id} className="bg-[#111] border border-gray-800 p-5 rounded-xl flex items-center justify-between hover:border-gray-700 transition-colors">
                <div className="flex flex-col">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold">{task.name}</h3>
                    <span className="px-2 py-0.5 text-xs rounded-full bg-gray-800 text-gray-300 capitalize">{task.category}</span>
                    <span className="px-2 py-0.5 text-xs rounded-full bg-indigo-900/30 text-indigo-300 capitalize">{task.executionMode}</span>
                  </div>
                  <p className="text-gray-400 text-sm mt-1">{task.description || task.templateId}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => handleRunNow(task.id)} className="bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
                    <PlayCircle className="w-4 h-4"/> Run Now
                  </button>
                  <button onClick={() => handleClone(task)} className="bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg text-sm text-white flex items-center gap-2 transition-colors">
                    <Copy className="w-4 h-4"/> Clone
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="bg-[#111] border border-gray-800 rounded-xl p-16 text-center">
          <Bot className="w-16 h-16 text-gray-600 mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-medium mb-2 text-gray-300">View Data Not Available in MVP</h2>
          <p className="text-gray-500">This tab ({activeTab}) will show historical logs, metrics, and generated workspace artifacts.</p>
        </div>
      )}

      {/* 5-Step Task Builder Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-[#0a0a0a] border border-gray-800 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Create Automation</h2>
                <p className="text-sm text-gray-400 mt-1">Step {wizardStep} of 5</p>
              </div>
              <button onClick={closeWizard} className="text-gray-400 hover:text-white p-2 hover:bg-gray-800 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {wizardStep === 1 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold mb-4">Step 1: Select Source</h3>
                  {sources.length === 0 ? (
                    <div className="bg-[#111] border border-dashed border-gray-700 rounded-xl p-12 text-center">
                      <Database className="w-12 h-12 text-gray-600 mx-auto mb-4 opacity-50" />
                      <h4 className="text-lg font-medium text-gray-300 mb-2">No Sources Available</h4>
                      <p className="text-gray-500 mb-6">You need to connect data sources to automate workflows.</p>
                      <div className="flex justify-center gap-4">
                        <button className="bg-gray-800 px-4 py-2 rounded-lg text-sm">Create Knowledge Base</button>
                        <button className="bg-gray-800 px-4 py-2 rounded-lg text-sm">Connect Database</button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {sources.map(s => {
                        const isSelected = newTask.sources.some((x: any) => x.id === s.id);
                        return (
                          <div 
                            key={s.id} 
                            onClick={() => {
                              if (isSelected) {
                                setNewTask({...newTask, sources: newTask.sources.filter((x: any) => x.id !== s.id)});
                              } else {
                                setNewTask({...newTask, sources: [...newTask.sources, { type: s.type, id: s.id }]});
                              }
                            }}
                            className={`p-4 rounded-xl border cursor-pointer transition-all ${isSelected ? 'border-indigo-500 bg-indigo-500/10' : 'border-gray-800 bg-[#111] hover:border-gray-700'}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-4 h-4 rounded-sm border flex items-center justify-center ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-gray-600'}`}>
                                {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                              </div>
                              <div>
                                <h4 className="font-medium text-white">{s.name}</h4>
                                <p className="text-xs text-gray-500 capitalize">{s.type.replace('_', ' ')}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {wizardStep === 2 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold mb-4">Step 2: Select Template</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {AUTOMATION_TEMPLATES.map(t => (
                      <div 
                        key={t.id}
                        onClick={() => setNewTask({...newTask, templateId: t.id, category: t.category, name: t.name, description: t.description, artifactTypes: t.defaultArtifactTypes })}
                        className={`p-5 rounded-xl border cursor-pointer transition-all ${newTask.templateId === t.id ? 'border-indigo-500 bg-indigo-500/10' : 'border-gray-800 bg-[#111] hover:border-gray-700'}`}
                      >
                        <span className="text-xs text-indigo-400 font-medium mb-2 block uppercase tracking-wider">{t.category}</span>
                        <h4 className="font-semibold text-white mb-2">{t.name}</h4>
                        <p className="text-sm text-gray-400 line-clamp-2">{t.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {wizardStep === 3 && (
                <div className="space-y-6 max-w-lg mx-auto">
                  <h3 className="text-xl font-semibold mb-4 text-center">Step 3: Configure Schedule</h3>
                  <div className="space-y-3">
                    {['manual', 'scheduled', 'triggered'].map(mode => (
                      <label key={mode} className={`flex items-start gap-4 p-5 rounded-xl border cursor-pointer transition-all ${newTask.executionMode === mode ? 'border-indigo-500 bg-indigo-500/10' : 'border-gray-800 bg-[#111]'}`}>
                        <input type="radio" name="executionMode" value={mode} checked={newTask.executionMode === mode} onChange={() => setNewTask({...newTask, executionMode: mode})} className="mt-1" />
                        <div>
                          <h4 className="font-semibold text-white capitalize">{mode === 'manual' ? 'Run Now / Manual' : mode === 'triggered' ? 'Event Triggered' : 'Scheduled'}</h4>
                          <p className="text-sm text-gray-400 mt-1">
                            {mode === 'manual' && "Run once immediately or wait for a user to press Run Now."}
                            {mode === 'scheduled' && "Runs on a recurring time interval (Daily, Weekly, Monthly)."}
                            {mode === 'triggered' && "Runs automatically when a Source (KB, DB, GitHub) changes."}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>

                  {newTask.executionMode === 'scheduled' && (
                    <div className="mt-6 p-5 bg-[#111] border border-gray-800 rounded-xl">
                      <label className="block text-sm text-gray-400 mb-2">Schedule Interval</label>
                      <select value={newTask.schedule} onChange={e => setNewTask({...newTask, schedule: e.target.value})} className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500">
                        <option value="">Select an interval...</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="custom">Custom Cron Expression</option>
                      </select>
                    </div>
                  )}

                  {newTask.executionMode === 'triggered' && (
                    <div className="mt-6 p-5 bg-[#111] border border-gray-800 rounded-xl">
                      <label className="block text-sm text-gray-400 mb-2">Trigger Event</label>
                      <select value={newTask.triggerEvent} onChange={e => setNewTask({...newTask, triggerEvent: e.target.value})} className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500">
                        <option value="">Select an event...</option>
                        <option value="on_kb_update">Knowledge Base Updated</option>
                        <option value="on_db_update">Database Updated</option>
                        <option value="on_github_push">GitHub Repository Push</option>
                        <option value="on_artifact_update">Artifact Updated</option>
                      </select>
                    </div>
                  )}
                </div>
              )}

              {wizardStep === 4 && (
                <div className="space-y-6 max-w-lg mx-auto">
                  <h3 className="text-xl font-semibold mb-4 text-center">Step 4: Configure Output</h3>
                  <p className="text-gray-400 text-center mb-6">Select the types of artifacts you want the Artifact Engine to generate from this automation.</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {['document', 'report', 'presentation', 'spreadsheet', 'assessment', 'api_collection'].map(type => {
                      const isSelected = newTask.artifactTypes.includes(type);
                      return (
                        <label key={type} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${isSelected ? 'border-indigo-500 bg-indigo-500/10' : 'border-gray-800 bg-[#111]'}`}>
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) setNewTask({...newTask, artifactTypes: [...newTask.artifactTypes, type]});
                              else setNewTask({...newTask, artifactTypes: newTask.artifactTypes.filter((t: string) => t !== type)});
                            }}
                          />
                          <span className="font-medium capitalize text-white">{type.replace('_', ' ')}</span>
                        </label>
                      )
                    })}
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm text-gray-400 mb-2">Custom Goal / Prompt (Optional)</label>
                    <textarea 
                      value={newTask.goal} 
                      onChange={e => setNewTask({...newTask, goal: e.target.value})} 
                      rows={4}
                      className="w-full bg-[#111] border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500" 
                      placeholder="Add specific instructions for the LLM during generation..."></textarea>
                  </div>
                </div>
              )}

              {wizardStep === 5 && (
                <div className="space-y-6 max-w-2xl mx-auto">
                  <div className="text-center mb-8">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold">Review & Activate</h3>
                    <p className="text-gray-400 mt-2">Your automation workflow is ready to be deployed.</p>
                  </div>
                  
                  <div className="bg-[#111] border border-gray-800 rounded-2xl p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <span className="text-xs text-gray-500 uppercase tracking-wider">Automation Name</span>
                        <div className="font-semibold text-lg mt-1">{newTask.name}</div>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 uppercase tracking-wider">Category</span>
                        <div className="font-semibold text-lg mt-1 capitalize text-indigo-400">{newTask.category}</div>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 uppercase tracking-wider">Execution</span>
                        <div className="font-semibold text-lg mt-1 capitalize">
                          {newTask.executionMode}
                          {newTask.schedule && ` (${newTask.schedule})`}
                          {newTask.triggerEvent && ` (${newTask.triggerEvent})`}
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 uppercase tracking-wider">Generated Artifacts</span>
                        <div className="font-semibold text-lg mt-1 capitalize">{newTask.artifactTypes.join(', ')}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-800 bg-[#0a0a0a] rounded-b-2xl flex justify-between items-center">
              <button 
                onClick={() => setWizardStep(prev => Math.max(1, prev - 1))} 
                disabled={wizardStep === 1}
                className="px-6 py-2.5 rounded-lg font-medium text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400 transition-colors"
              >
                Back
              </button>
              
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(step => (
                  <div key={step} className={`w-2 h-2 rounded-full ${wizardStep === step ? 'bg-indigo-500' : wizardStep > step ? 'bg-indigo-900' : 'bg-gray-800'}`} />
                ))}
              </div>

              {wizardStep < 5 ? (
                <button 
                  onClick={() => setWizardStep(prev => prev + 1)}
                  disabled={(wizardStep === 1 && newTask.sources.length === 0 && sources.length > 0) || (wizardStep === 2 && !newTask.templateId)}
                  className="bg-white text-black hover:bg-gray-200 px-6 py-2.5 rounded-lg font-bold disabled:opacity-50 transition-colors"
                >
                  Continue
                </button>
              ) : (
                <button 
                  onClick={handleCreateTask}
                  disabled={saving}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2.5 rounded-lg font-bold disabled:opacity-50 flex items-center gap-2 transition-colors shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)]"
                >
                  {saving && <Activity className="w-5 h-5 animate-spin" />}
                  {saving ? 'Deploying...' : 'Activate Automation'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
