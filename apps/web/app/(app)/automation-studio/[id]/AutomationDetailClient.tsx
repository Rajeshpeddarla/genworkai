"use client";

import React, { useState } from 'react';
import { FileText, PlayCircle, Clock, CheckCircle, XCircle, Download, RefreshCw, Zap } from 'lucide-react';
import { QuizPlayer } from '@/components/automation/QuizPlayer';

export function AutomationDetailClient({ task, logs }: { task: any, logs: any[] }) {
  const [playingQuizId, setPlayingQuizId] = useState<number | null>(null);

  const handleStartQuiz = (logId: number) => {
    setPlayingQuizId(logId);
  };

  return (
    <>
      {playingQuizId ? (
        <div className="mb-8">
          <button onClick={() => setPlayingQuizId(null)} className="text-gray-400 hover:text-white text-sm mb-4">
            ← Back to Execution History
          </button>
          <QuizPlayer 
            quizData={null} // Normally you'd fetch the artifact content here
            onComplete={(score) => alert(`You scored ${score}!`)} 
          />
        </div>
      ) : (
        <div>
          <h2 className="text-xl font-bold mb-4">Execution History & Artifacts</h2>
          {logs.length === 0 ? (
            <div className="text-center py-16 text-gray-500 bg-[#111] rounded-xl border border-gray-800/50">
              No executions yet. Run this automation to generate artifacts.
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map(log => (
                <div key={log.id} className="bg-[#111] border border-gray-800 p-5 rounded-xl flex items-center justify-between hover:border-gray-700 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      log.status === 'success' ? 'bg-green-900/30' : 
                      log.status === 'running' ? 'bg-indigo-900/30 animate-pulse' : 
                      'bg-red-900/30'
                    }`}>
                      {log.status === 'success' ? <CheckCircle className="w-5 h-5 text-green-400" /> : 
                       log.status === 'running' ? <Clock className="w-5 h-5 text-indigo-400" /> : 
                       <XCircle className="w-5 h-5 text-red-400" />}
                    </div>
                    <div>
                      <div className="font-medium">{log.startedAt?.toLocaleString()}</div>
                      <div className="text-sm text-gray-500 flex gap-4 mt-1">
                        <span className="capitalize">Status: {log.status}</span>
                        {log.creditsConsumed !== null && <span>Credits Used: {log.creditsConsumed || 'Determining...'}</span>}
                      </div>
                    </div>
                  </div>
                  
                  {log.artifactId && (
                    <div className="flex gap-2">
                      {task.templateId === 'quiz_generation' && (
                        <button onClick={() => handleStartQuiz(log.id)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
                          <Zap className="w-4 h-4"/> Start Quiz
                        </button>
                      )}
                      <button className="bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
                        <FileText className="w-4 h-4"/> Preview
                      </button>
                      <button className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
                        <Download className="w-4 h-4"/> Download
                      </button>
                      <button className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
                        <RefreshCw className="w-4 h-4"/> Regenerate
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
