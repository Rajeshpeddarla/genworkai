"use client";

import React, { useState, useEffect } from 'react';
import { LayoutDashboard, FileQuestion, ListChecks, History, BarChart, Settings, PlusCircle, PlayCircle, Clock, CheckCircle, Search, X, Activity, BrainCircuit } from 'lucide-react';
import { QuizGenerationWizard } from './QuizGenerationWizard';
import { QuizPlayer } from '../../../components/automation/QuizPlayer';
import { ShareExamModal } from './ShareExamModal';
import { Share2 } from 'lucide-react';

export function QuizCenter() {
  const [activeSubTab, setActiveSubTab] = useState('dashboard');
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeQuiz, setActiveQuiz] = useState<any | null>(null);
  const [shareQuizId, setShareQuizId] = useState<number | null>(null);

  const fetchQuizzes = () => {
    setLoading(true);
    const persona = localStorage.getItem('automationPersona') || 'General';
    Promise.all([
      fetch(`/api/quizzes?persona=${encodeURIComponent(persona)}`).then(r => r.json()),
      fetch(`/api/quizzes/attempts?persona=${encodeURIComponent(persona)}`).then(r => r.json())
    ]).then(([quizzesData, attemptsData]) => {
      setQuizzes(quizzesData.quizzes || []);
      setAttempts(attemptsData.attempts || []);
      setLoading(false);
    }).catch(e => {
      console.error(e);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchQuizzes();
  }, [activeSubTab]);

  const launchQuiz = (quizId: number) => {
    fetch(`/api/quizzes?id=${quizId}`)
      .then(r => r.json())
      .then(data => {
        if (data.quiz && data.questions) {
          setActiveQuiz({ ...data.quiz, questions: data.questions });
        }
      });
  };

  const avgScore = attempts.length > 0 
    ? (attempts.reduce((acc, curr) => acc + (parseFloat(curr.attempt.score) / Math.max(1, parseFloat(curr.attempt.totalMarks))) * 100, 0) / attempts.length).toFixed(1)
    : 0;

  return (
    <div className="flex flex-row flex-1 h-full min-h-0 border border-gray-800 rounded-2xl overflow-hidden bg-[#0a0a0a] shadow-xl relative">
      
      {/* Sidebar Navigation */}
      <div className="w-[280px] lg:w-[320px] border-r border-gray-800 bg-[#0a0a0a] flex flex-col shrink-0 overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/20">
              <BrainCircuit className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">Quiz Center</h1>
              <p className="text-xs text-gray-500 line-clamp-2 mt-1">Generate and take interactive assessments.</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-8 bg-[#111] p-3 rounded-xl border border-gray-800/50">
            <div className="flex flex-col items-center justify-center">
              <span className="text-white font-bold text-lg">{attempts.length}</span>
              <span className="text-[10px] text-gray-500 font-medium uppercase mt-0.5">Runs</span>
            </div>
            <div className="flex flex-col items-center justify-center border-l border-r border-gray-800/80">
              <span className="text-white font-bold text-lg">{attempts.length * 15}</span>
              <span className="text-[10px] text-gray-500 font-medium uppercase mt-0.5">Saved</span>
            </div>
            <div className="flex flex-col items-center justify-center">
              <span className="text-white font-bold text-lg">{(attempts.length * 2.4).toFixed(1)}k</span>
              <span className="text-[10px] text-gray-500 font-medium uppercase mt-0.5">Tokens</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => setActiveSubTab('dashboard')}
              className={`p-3 rounded-xl text-sm font-medium flex items-center gap-3 transition-colors ${
                activeSubTab === 'dashboard' ? 'bg-[#1a1a1a] text-white border border-gray-700 shadow-sm' : 'text-gray-400 hover:text-gray-200 hover:bg-[#111] border border-transparent'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </button>
            <button
              onClick={() => setActiveSubTab('generate')}
              className={`p-3 rounded-xl text-sm font-medium flex items-center gap-3 transition-colors ${
                activeSubTab === 'generate' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-gray-400 hover:text-gray-200 hover:bg-[#111] border border-transparent'
              }`}
            >
              <PlusCircle className="w-4 h-4" /> Generate New
            </button>
            <button
              onClick={() => setActiveSubTab('my_quizzes')}
              className={`p-3 rounded-xl text-sm font-medium flex items-center gap-3 transition-colors ${
                activeSubTab === 'my_quizzes' ? 'bg-[#1a1a1a] text-white border border-gray-700 shadow-sm' : 'text-gray-400 hover:text-gray-200 hover:bg-[#111] border border-transparent'
              }`}
            >
              <FileQuestion className="w-4 h-4" /> My Quizzes
            </button>
            <button
              onClick={() => setActiveSubTab('attempts')}
              className={`p-3 rounded-xl text-sm font-medium flex items-center gap-3 transition-colors ${
                activeSubTab === 'attempts' ? 'bg-[#1a1a1a] text-white border border-gray-700 shadow-sm' : 'text-gray-400 hover:text-gray-200 hover:bg-[#111] border border-transparent'
              }`}
            >
              <ListChecks className="w-4 h-4" /> Attempts
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 bg-[#111] overflow-y-auto relative no-scrollbar">
        <div className="p-8 w-full mx-auto h-full flex flex-col">
          
          {activeSubTab === 'dashboard' && (
            <div className="animate-in fade-in duration-300 w-full max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <div className="flex items-center gap-2 text-white font-bold text-xl">
                    <LayoutDashboard className="w-5 h-5 text-indigo-400" /> Quiz Dashboard
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    Track your performance and recent activity
                  </div>
                </div>
                <button 
                  onClick={() => setActiveSubTab('generate')}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2.5 px-5 rounded-xl flex items-center gap-2 transition-colors shadow-lg shadow-indigo-500/20"
                >
                  <PlusCircle className="w-4 h-4" /> Create Quiz
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Stats Stack */}
                <div className="lg:col-span-4 flex flex-col gap-4">
                  <div className="bg-[#1a1a1a] border border-gray-800 p-6 rounded-2xl flex flex-col justify-center relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all"></div>
                    <div className="text-gray-400 text-sm font-medium mb-2 flex items-center gap-2"><FileQuestion className="w-4 h-4"/> Total Quizzes</div>
                    <div className="text-4xl font-bold text-white">{quizzes.length}</div>
                  </div>
                  <div className="bg-[#1a1a1a] border border-gray-800 p-6 rounded-2xl flex flex-col justify-center relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
                    <div className="text-gray-400 text-sm font-medium mb-2 flex items-center gap-2"><ListChecks className="w-4 h-4"/> Total Attempts</div>
                    <div className="text-4xl font-bold text-white">{attempts.length}</div>
                  </div>
                  <div className="bg-[#1a1a1a] border border-gray-800 p-6 rounded-2xl flex flex-col justify-center relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all"></div>
                    <div className="text-gray-400 text-sm font-medium mb-2 flex items-center gap-2"><BarChart className="w-4 h-4"/> Average Score</div>
                    <div className="text-4xl font-bold text-indigo-400">{avgScore}%</div>
                  </div>
                </div>

                {/* Right Column: Recent Activity */}
                <div className="lg:col-span-8 flex flex-col">
                  <h3 className="font-bold text-lg text-white mb-4">Recent Activity</h3>
                  {attempts.length === 0 ? (
                    <div className="flex-1 text-center py-12 text-gray-500 border border-gray-800 rounded-2xl bg-[#1a1a1a] flex flex-col items-center justify-center min-h-[300px]">
                      <Activity className="w-8 h-8 text-gray-600 mb-4" />
                      Your recent quiz activity will appear here.
                    </div>
                  ) : (
                    <div className="border border-gray-800 rounded-2xl overflow-hidden bg-[#1a1a1a]">
                      {attempts.slice(0, 5).map((att: any, i: number) => (
                        <div key={att.attempt.id} className={`p-5 flex justify-between items-center hover:bg-[#222] transition-colors ${i !== 0 ? 'border-t border-gray-800/50' : ''}`}>
                          <div className="flex items-center gap-4">
                            <div className="bg-indigo-500/10 p-2.5 rounded-xl border border-indigo-500/20">
                              <CheckCircle className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div>
                              <h4 className="font-bold text-white">{att.quiz.title}</h4>
                              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {new Date(att.attempt.startedAt).toLocaleString()}
                                {att.attempt.guestName ? (
                                  <span className="ml-2 px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-bold">
                                    {att.attempt.guestName}
                                  </span>
                                ) : (
                                  <span className="ml-2 px-2 py-0.5 rounded bg-gray-800 text-gray-400 font-bold">
                                    You
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-indigo-400">{att.attempt.score} <span className="text-sm text-gray-500 font-medium">/ {att.attempt.totalMarks}</span></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'my_quizzes' && (
            <div className="animate-in fade-in duration-300 w-full max-w-7xl mx-auto">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <div className="flex items-center gap-2 text-white font-bold text-xl">
                    <FileQuestion className="w-5 h-5 text-indigo-400" /> My Quizzes
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    {quizzes.length} custom assessments ready to take
                  </div>
                </div>
              </div>
              
              {loading ? (
                <div className="text-center py-12 text-gray-500">Loading quizzes...</div>
              ) : quizzes.length === 0 ? (
                <div className="text-center py-12 text-gray-500 bg-[#1a1a1a] border border-gray-800 rounded-2xl">
                  No quizzes created yet. Head to "Generate Quiz" to create one.
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {quizzes.map(quiz => (
                    <div key={quiz.id} className="relative rounded-2xl overflow-hidden bg-[#1a1a1a] border border-gray-800 hover:border-gray-700 transition-all flex flex-col group shadow-lg cursor-default">
                      {/* Gradient Top Half */}
                      <div className="h-36 bg-gradient-to-br from-indigo-500/90 via-blue-600/80 to-purple-600/90 p-5 relative overflow-hidden shrink-0">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                        
                        <div className="relative z-10 flex justify-between items-start">
                          <div className="bg-black/30 backdrop-blur-md text-white/90 text-[11px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5 border border-white/10">
                            <ListChecks className="w-3 h-3" /> Q&A
                          </div>
                          <div className="bg-black/30 backdrop-blur-md text-white/90 text-[11px] font-bold px-3 py-1 rounded-full border border-white/10 shadow-sm">
                            Custom
                          </div>
                        </div>
                        <div className="relative z-10 mt-6 text-white font-bold text-xl line-clamp-2 leading-tight drop-shadow-md">
                          {quiz.title}
                        </div>
                      </div>
                      
                      {/* Bottom Half */}
                      <div className="bg-[#1a1a1a] p-5 flex flex-col flex-1 justify-between">
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span className="font-medium text-gray-300">Assessment</span>
                          <span className="flex items-center"><Clock className="w-3 h-3 mr-1"/> {new Date(quiz.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-4 pt-1">
                          <button 
                            onClick={() => launchQuiz(quiz.id)}
                            className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white font-bold py-2.5 rounded-xl flex justify-center items-center gap-2 transition-all shadow-md shadow-indigo-500/20"
                          >
                            <PlayCircle className="w-4 h-4"/> Take Quiz
                          </button>
                          <button
                            onClick={() => setShareQuizId(quiz.id)}
                            className="bg-[#222] hover:bg-[#333] border border-gray-700 text-white p-2.5 rounded-xl transition-colors"
                            title="Share Exam"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSubTab === 'generate' && (
            <div className="animate-in fade-in duration-300 w-full max-w-5xl mx-auto h-full min-h-[600px] flex flex-col">
              <QuizGenerationWizard onComplete={() => { setActiveSubTab('my_quizzes'); fetchQuizzes(); }} />
            </div>
          )}

          {activeSubTab === 'attempts' && (
            <div className="animate-in fade-in duration-300 w-full max-w-5xl mx-auto">
              <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-2"><History className="w-5 h-5 text-indigo-400"/> All Attempts</h2>
              {attempts.length === 0 ? (
                <div className="text-center py-12 text-gray-500 border border-gray-800 rounded-2xl bg-[#1a1a1a]">
                  No attempts recorded yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {attempts.map((att: any) => (
                    <div key={att.attempt.id} className="bg-[#1a1a1a] border border-gray-800 p-6 rounded-2xl flex justify-between items-center hover:border-gray-700 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/20">
                          <ListChecks className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-white">{att.quiz.title}</h3>
                          <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3" /> {new Date(att.attempt.startedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-indigo-400">
                          {att.attempt.score} <span className="text-sm font-medium text-gray-500">/ {att.attempt.totalMarks}</span>
                        </div>
                        <div className="text-xs text-gray-500 tracking-wider mt-1 font-bold">
                          {att.attempt.guestName ? (
                            <span className="text-indigo-400">{att.attempt.guestName} ({att.attempt.guestRollNumber})</span>
                          ) : (
                            <span className="uppercase">{att.attempt.status}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Modal Popup Overlay for Quiz Player */}
      {activeQuiz && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-8 animate-in fade-in duration-200">
          <div className="bg-[#0a0a0a] border border-gray-800 rounded-2xl w-full max-w-6xl h-full shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 relative">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-[#111] shrink-0">
              <h2 className="text-lg font-bold text-white flex items-center gap-2"><PlayCircle className="w-5 h-5 text-indigo-400" /> {activeQuiz.title}</h2>
              <button 
                onClick={() => setActiveQuiz(null)}
                className="bg-black/50 hover:bg-black/80 border border-gray-700 text-white p-2 rounded-full backdrop-blur-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto relative bg-[#0a0a0a]">
              <QuizPlayer quizData={activeQuiz} rules={activeQuiz.rules} onComplete={() => { setActiveQuiz(null); fetchQuizzes(); }} />
            </div>
          </div>
        </div>
      )}
      
      {shareQuizId && (
        <ShareExamModal 
          quizId={shareQuizId} 
          onClose={() => setShareQuizId(null)} 
        />
      )}

    </div>
  );
}
