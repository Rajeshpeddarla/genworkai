"use client";

import React, { useState, useEffect } from 'react';
import { Bot, PlayCircle, Activity, Server, Clock, CheckCircle, LayoutDashboard, Notebook, ListChecks, History, Book, FileText, Code, Terminal, BarChart, Database, Settings, Pause, GraduationCap, Briefcase, User } from 'lucide-react';
import { QuizCenter } from './QuizCenter';
import { StudyCenter, LessonPlanner, QuestionPaperCenter, RepositoryCenter, ReportsCenter, GenericCenter } from './centers';
import Link from 'next/link';

type Persona = 'Student' | 'Teacher' | 'Developer' | 'Business' | 'General';

const tabsConfig = {
  Student: [
    { id: 'quiz', label: 'Quiz', icon: <CheckCircle className="w-4 h-4" /> },
    { id: 'study_notes', label: 'Study Notes', icon: <Notebook className="w-4 h-4" /> },
    { id: 'learning_plans', label: 'Learning Plans', icon: <ListChecks className="w-4 h-4" /> },
    { id: 'history', label: 'History', icon: <History className="w-4 h-4" /> },
  ],
  Teacher: [
    { id: 'quiz_manager', label: 'Quiz Manager', icon: <CheckCircle className="w-4 h-4" /> },
    { id: 'question_papers', label: 'Question Papers', icon: <FileText className="w-4 h-4" /> },
    { id: 'lesson_planner', label: 'Lesson Planner', icon: <Book className="w-4 h-4" /> },
  ],
  Developer: [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'repo_reports', label: 'Repository Reports', icon: <Code className="w-4 h-4" /> },
    { id: 'api_docs', label: 'API Documentation', icon: <Terminal className="w-4 h-4" /> },
    { id: 'reports', label: 'Reports', icon: <FileText className="w-4 h-4" /> },
  ],
  Business: [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'reports', label: 'Reports', icon: <FileText className="w-4 h-4" /> },
    { id: 'dashboards', label: 'Dashboards', icon: <BarChart className="w-4 h-4" /> },
    { id: 'monitoring', label: 'Monitoring', icon: <Activity className="w-4 h-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <Database className="w-4 h-4" /> },
    { id: 'history', label: 'History', icon: <History className="w-4 h-4" /> },
  ],
  General: [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'summaries', label: 'Summaries', icon: <FileText className="w-4 h-4" /> },
    { id: 'notes', label: 'Notes', icon: <Notebook className="w-4 h-4" /> },
    { id: 'quiz', label: 'Quiz', icon: <CheckCircle className="w-4 h-4" /> },
    { id: 'reports', label: 'Reports', icon: <BarChart className="w-4 h-4" /> },
    { id: 'history', label: 'History', icon: <History className="w-4 h-4" /> },
  ],
};

const personaIcons = {
  Student: <GraduationCap className="w-5 h-5" />,
  Teacher: <Book className="w-5 h-5" />,
  Developer: <Code className="w-5 h-5" />,
  Business: <Briefcase className="w-5 h-5" />,
  General: <User className="w-5 h-5" />,
};

export default function AutomationStudio() {
  const [activePersona, setActivePersona] = useState<Persona>('General');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [tasks, setTasks] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [builderPrompt, setBuilderPrompt] = useState<string | undefined>();
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);

  useEffect(() => {
    const savedPersona = localStorage.getItem('automationPersona') as Persona;
    if (savedPersona && tabsConfig[savedPersona]) {
      setActivePersona(savedPersona);
      setActiveTab(tabsConfig[savedPersona]?.[0]?.id || 'dashboard');
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tasksRes, sourcesRes, profileRes] = await Promise.all([
        fetch('/api/automation'),
        fetch('/api/automation/sources'),
        fetch('/api/profile')
      ]);
      
      if (tasksRes.ok) setTasks(await tasksRes.json());
      if (profileRes.ok) setProfileData(await profileRes.json());
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

  const switchPersona = (persona: Persona) => {
    setActivePersona(persona);
    setActiveTab(tabsConfig[persona]?.[0]?.id || 'dashboard');
    localStorage.setItem('automationPersona', persona);
  };

  const handleRunNow = async (taskId: number) => {
    try {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'running' } : t));
      const res = await fetch(`/api/automation/${taskId}/run`, { method: 'POST' });
      if (!res.ok) {
        const text = await res.text();
        console.error('Run failed:', res.status, text);
        throw new Error('Failed to run task: ' + text);
      }
    } catch (e) {
      console.error(e);
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'active' } : t));
    }
  };

  const handleTogglePause = async (taskId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'paused' ? 'active' : 'paused';
    try {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      const res = await fetch(`/api/automation/${taskId}/pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Failed to toggle status');
    } catch (e) {
      console.error(e);
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: currentStatus } : t));
    }
  };

  const totalAutomations = tasks.length;
  const runningAutomations = tasks.filter(t => t.status === 'running').length;
  const totalRuns = tasks.reduce((acc, t) => acc + (t.totalRuns || 0), 0);
  const monthlyLimit = profileData?.limits?.aiCredits?.monthlyLimit || 0;
  const monthlyRemaining = profileData?.limits?.aiCredits?.monthly || 0;
  const creditsConsumedThisMonth = monthlyLimit > 0 ? (monthlyLimit - monthlyRemaining) : 0;
  
  // Basic filtering for demo purposes based on tab name matching task intent/name
  const filteredTasks = tasks.filter(t => {
    if (activeTab === 'dashboard') return true;
    if (activeTab === 'history' || activeTab === 'artifacts') return true;
    
    // Very rudimentary filter based on names
    const searchStr = `${t.name} ${t.description} ${t.goal}`.toLowerCase();
    if (activeTab.includes('quiz')) return searchStr.includes('quiz');
    if (activeTab.includes('note') || activeTab.includes('summar')) return searchStr.includes('note') || searchStr.includes('summar');
    if (activeTab.includes('plan')) return searchStr.includes('plan');
    if (activeTab.includes('report') || activeTab.includes('doc')) return searchStr.includes('report') || searchStr.includes('doc');
    return searchStr.includes(activeTab.split('_')[0] || '');
  });

  return (
    <div className="p-8 w-full h-screen flex flex-col text-white bg-[#0a0a0a]">
      {/* Header & Persona Selector */}
      <div className="flex flex-col gap-6 mb-8 shrink-0">
        <div>
          <h1 className="text-3xl font-bold">Automation Studio</h1>
          <p className="text-gray-400 mt-1">Select your role to view tailored tools and automations.</p>
        </div>
        
        <div className="flex gap-2 p-1.5 bg-[#111] border border-gray-800 rounded-xl w-fit">
          {(Object.keys(tabsConfig) as Persona[]).map(p => (
            <button
              key={p}
              onClick={() => switchPersona(p)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activePersona === p ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
              }`}
            >
              {personaIcons[p]} {p}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 mb-8 border-b border-gray-800 pb-0 overflow-x-auto no-scrollbar shrink-0">
        {tabsConfig[activePersona].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-1 py-3 flex items-center gap-2 font-medium transition-colors ${activeTab === tab.id ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-gray-300'}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0">
        {loading ? (
          <div className="flex justify-center py-20"><Activity className="w-8 h-8 text-indigo-500 animate-spin" /></div>
        ) : activeTab === 'dashboard' ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-[#111] border border-gray-800 p-4 rounded-xl">
                <div className="text-gray-400 text-sm mb-1">Total Automations</div>
                <div className="text-2xl font-bold">{totalAutomations}</div>
              </div>
              <div className="bg-[#111] border border-indigo-900/50 p-4 rounded-xl">
                <div className="text-indigo-400 text-sm mb-1">Running Now</div>
                <div className="text-2xl font-bold text-indigo-400">{runningAutomations}</div>
              </div>
              <div className="bg-[#111] border border-green-900/30 p-4 rounded-xl">
                <div className="text-green-400 text-sm mb-1">Total Executions</div>
                <div className="text-2xl font-bold text-green-400">{totalRuns}</div>
              </div>
              <div className="bg-[#111] border border-gray-800 p-4 rounded-xl">
                <div className="text-gray-400 text-sm mb-1">Credits This Month</div>
                <div className="text-2xl font-bold">{creditsConsumedThisMonth}</div>
              </div>
            </div>
            <h2 className="text-lg font-bold mb-4">Recent Activity</h2>
            {/* List all automations briefly */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tasks.slice(0, 4).map(task => (
                <Link href={`/automation-studio/${task.id}`} key={task.id} className="block bg-[#111] border border-gray-800 p-5 rounded-xl hover:border-gray-700 transition-colors">
                  <h3 className="font-bold">{task.name}</h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-1">{task.description}</p>
                </Link>
              ))}
            </div>
          </>
        ) : activeTab === 'quiz' || activeTab === 'quiz_manager' ? (
          <QuizCenter />
        ) : activeTab === 'study_notes' ? (
          <StudyCenter sources={sources} />
        ) : activeTab === 'lesson_planner' ? (
          <LessonPlanner sources={sources} />
        ) : activeTab === 'question_papers' ? (
          <QuestionPaperCenter sources={sources} />
        ) : activeTab === 'repo_reports' || activeTab === 'api_docs' ? (
          <RepositoryCenter sources={sources} />
        ) : activeTab === 'reports' || activeTab === 'dashboards' || activeTab === 'analytics' ? (
          <ReportsCenter sources={sources} />
        ) : (
          <GenericCenter moduleName={tabsConfig[activePersona].find(t => t.id === activeTab)?.label || 'Module'} sources={sources} />
        )}
      </div>
    </div>
  );
}
