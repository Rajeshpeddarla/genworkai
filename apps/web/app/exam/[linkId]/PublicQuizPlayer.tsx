"use client";
import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, Clock, AlertTriangle, ArrowRight, ArrowLeft } from 'lucide-react';

interface Question {
  id: string;
  type: string;
  text: string;
  questionText?: string;
  options?: string[];
}

export function PublicQuizPlayer({ 
  linkId, 
  attemptId, 
  questions, 
  rules, 
  timingMode, 
  endTime,
  onComplete 
}: { 
  linkId: string, 
  attemptId: number, 
  questions: Question[], 
  rules: any, 
  timingMode: string,
  endTime: string | null,
  onComplete: (score: number, total: number) => void 
}) {
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Time Left logic
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [warnings, setWarnings] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Determine initial time left based on rules (self_paced) or global endTime
    let initialTimeLeft = rules?.totalTime || null;

    if (timingMode === 'global' && endTime) {
      const msLeft = new Date(endTime).getTime() - new Date().getTime();
      initialTimeLeft = Math.max(0, Math.floor(msLeft / 1000));
    }

    if (initialTimeLeft !== null) {
      setTimeLeft(initialTimeLeft);
    }
  }, [rules, timingMode, endTime]);

  useEffect(() => {
    let timer: any;
    if (started && timeLeft !== null && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(t => {
          if (t && t <= 1) {
            handleAutoSubmit();
            return 0;
          }
          return t ? t - 1 : 0;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [started, timeLeft]);

  useEffect(() => {
    if (!started || !rules?.antiCheating) return;

    const handleVisibilityChange = () => {
      if (document.hidden && rules.antiCheating.tabSwitch) {
        setWarnings(w => {
          const newWarnings = w + 1;
          alert(`WARNING (${newWarnings}/3): Tab switch detected.\nRepeated violations will result in automatic submission.`);
          if (newWarnings >= 3) {
            handleAutoSubmit();
          }
          return newWarnings;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [started, rules]);

  const handleAutoSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    await submitExam();
  };

  const submitExam = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/exam/${linkId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId,
          answers,
          warningsCount: warnings,
          antiCheatingLogs: { tabSwitches: warnings }
        })
      });
      const data = await res.json();
      if (data.success) {
        onComplete(data.score, data.totalMarks);
      } else {
        alert(data.error || 'Failed to submit exam');
      }
    } catch (e) {
      console.error(e);
      alert('Error submitting exam.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelect = (option: string) => {
    const q = questions[currentIndex];
    if (q) {
      setAnswers(prev => ({ ...prev, [q.id]: option }));
    }
  };

  if (!started) {
    return (
      <div className="bg-[#111] border border-gray-800 rounded-xl p-8 text-center min-h-[500px] flex flex-col justify-center items-center">
        <CheckCircle className="w-16 h-16 text-indigo-500 mb-6" />
        <h2 className="text-3xl font-bold mb-4 text-white">Quiz Ready</h2>
        <p className="text-gray-400 mb-8 max-w-lg">
          You have {questions.length} questions to answer. 
          {rules?.antiCheating?.tabSwitch && (
            <span className="block mt-2 text-red-400 font-bold"><AlertTriangle className="w-4 h-4 inline mr-1"/> Anti-cheating is enabled. Do not switch tabs.</span>
          )}
        </p>
        <button 
          onClick={() => {
            if (rules?.antiCheating?.fullscreen && containerRef.current) {
              containerRef.current.requestFullscreen().catch(e => console.error(e));
            }
            setStarted(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-colors shadow-lg shadow-indigo-900/50"
        >
          Start Assessment
        </button>
      </div>
    );
  }

  const q = questions[currentIndex];
  if (!q) return null;

  return (
    <div ref={containerRef} className="flex flex-col h-full bg-[#0a0a0a] text-white overflow-hidden min-h-[600px] rounded-xl border border-gray-800">
      <div className="bg-[#111] border-b border-gray-800 p-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="font-bold">Question {currentIndex + 1} of {questions.length}</div>
        </div>
        <div className="flex items-center gap-6">
          {timeLeft !== null && (
            <div className={`font-mono text-xl font-bold flex items-center gap-2 ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-indigo-400'}`}>
              <Clock className="w-5 h-5" /> {formatTime(timeLeft)}
            </div>
          )}
          <button 
            onClick={submitExam}
            disabled={isSubmitting}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            {isSubmitting ? 'Submitting...' : 'End Exam'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 relative flex">
        <div className="w-full max-w-4xl mx-auto flex flex-col">
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-8 shadow-sm flex-1">
            <h3 className="text-2xl font-semibold mb-8 text-white leading-relaxed">
              {q.questionText || q.text}
            </h3>

            {(q.type === 'multiple_choice' || q.type === 'true_false') && q.options && (
              <div className="space-y-4">
                {q.options.map((opt: string, i: number) => {
                  const isSelected = answers[q.id] === opt;
                  return (
                    <button
                      key={i}
                      onClick={() => handleSelect(opt)}
                      className={`w-full text-left p-5 rounded-xl border transition-all ${
                        isSelected 
                          ? 'border-indigo-500 bg-indigo-500/10 text-white' 
                          : 'border-gray-800 hover:border-gray-600 bg-[#222] text-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-indigo-500' : 'border-gray-600'
                        }`}>
                          {isSelected && <div className="w-3 h-3 bg-indigo-500 rounded-full" />}
                        </div>
                        <span className="text-lg">{opt}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#111] border-t border-gray-800 p-4 flex justify-between items-center z-10 shrink-0">
        <button
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 bg-[#222] hover:bg-[#333] text-white px-6 py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
        >
          <ArrowLeft className="w-5 h-5" /> Previous
        </button>
        
        {currentIndex < questions.length - 1 ? (
          <button
            onClick={() => setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-lg shadow-indigo-900/50"
          >
            Next <ArrowRight className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={submitExam}
            disabled={isSubmitting}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-lg shadow-green-900/50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Exam'} <CheckCircle className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
