"use client";
import React, { useState } from 'react';
import { Bot, PlayCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function QuizExperience({ onClose }: { onClose: () => void }) {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('Beginner');
  const [step, setStep] = useState<'form' | 'generating' | 'error'>('form');
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  const handleGenerate = async () => {
    setStep('generating');
    try {
      const res = await fetch('/api/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Quiz: ${topic}`,
          category: 'knowledge',
          templateId: 'quiz_generation',
          artifactTypes: ['document'],
          executionMode: 'manual', 
          goal: `Generate a 10-question quiz on ${topic} at ${difficulty} level.`
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create automation');
      
      const taskId = data.taskId;

      // Navigate to the automation detail view where the user can see logs & artifacts
      router.push(`/automation-studio/${taskId}`);

    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message);
      setStep('error');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-[#111] border border-gray-800 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-gray-800 flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2"><Bot className="w-5 h-5 text-indigo-400" /> AI Quiz Generator</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white">✕</button>
        </div>
        
        <div className="p-6">
          {step === 'form' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">What topic do you want a quiz on?</label>
                <input 
                  type="text" 
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Cellular Respiration, React Hooks..." 
                  className="w-full bg-[#1a1a1a] border border-gray-800 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Difficulty</label>
                <select 
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-gray-800 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
              <button 
                onClick={handleGenerate}
                disabled={!topic}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg mt-4 transition-colors"
              >
                Generate Quiz (5 Credits)
              </button>
            </div>
          )}

          {step === 'generating' && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-gray-300">Initiating Quiz Generation...</h3>
              <p className="text-sm text-gray-500 mt-2">Setting up your automation workspace</p>
            </div>
          )}
          
          {step === 'error' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-red-900/30 flex items-center justify-center mx-auto mb-4 text-red-400 text-2xl font-bold">!</div>
              <h3 className="text-lg font-medium text-gray-300">Generation Failed</h3>
              <p className="text-sm text-red-400 mt-2">{errorMsg}</p>
              <button onClick={() => setStep('form')} className="mt-6 bg-gray-800 hover:bg-gray-700 px-6 py-2 rounded-lg font-medium">Try Again</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
