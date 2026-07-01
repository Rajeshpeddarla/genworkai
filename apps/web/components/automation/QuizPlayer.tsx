import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, XCircle, ArrowRight, ArrowLeft, RefreshCw, Clock, AlertTriangle, Save, Maximize, Flag, HelpCircle } from 'lucide-react';

interface Question {
  id: string;
  type: string;
  text: string;
  questionText?: string;
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
}

type QuestionStatus = 'not_visited' | 'visited' | 'answered' | 'marked_review' | 'skipped';

export function QuizPlayer({ quizData, rules, onComplete }: { quizData: any, rules?: any, onComplete?: (score: number) => void }) {
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [statuses, setStatuses] = useState<Record<number, QuestionStatus>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  
  // Timer & Auto-save
  const [timeLeft, setTimeLeft] = useState<number>(rules?.totalTime || 3600); 
  const [lastSaved, setLastSaved] = useState<Date>(new Date());
  
  // Anti-cheating
  const [warnings, setWarnings] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const questions: Question[] = quizData?.questions || [];

  useEffect(() => {
    if (questions.length > 0 && Object.keys(statuses).length === 0) {
      const initialStatuses: Record<number, QuestionStatus> = {};
      questions.forEach((_, i) => initialStatuses[i] = 'not_visited');
      initialStatuses[0] = 'visited';
      setStatuses(initialStatuses);
    }
  }, [questions]);

  // Timer Effect
  useEffect(() => {
    let timer: any;
    if (started && !isFinished && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            handleAutoSubmit();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [started, isFinished, timeLeft]);

  // Auto-save Effect
  useEffect(() => {
    if (started && !isFinished) {
      const saveTimer = setInterval(() => {
        setLastSaved(new Date());
        // In a real app, call an API to save `answers` and `statuses`
      }, 10000);
      return () => clearInterval(saveTimer);
    }
  }, [started, isFinished, answers]);

  // Anti-cheating listeners
  useEffect(() => {
    if (!started || isFinished || !rules?.antiCheating) return;

    const handleVisibilityChange = () => {
      if (document.hidden && rules.antiCheating.tabSwitch) {
        issueWarning('Tab switch detected.');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [started, isFinished, rules]);

  const issueWarning = (reason: string) => {
    setWarnings(w => {
      const newWarnings = w + 1;
      alert(`WARNING (${newWarnings}/3): ${reason}\nRepeated violations will result in automatic submission.`);
      if (newWarnings >= 3) {
        handleAutoSubmit();
      }
      return newWarnings;
    });
  };

  const handleAutoSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    let calculatedScore = 0;
    const formattedAnswers = questions.map((q, i) => {
      const userAnswer = answers[i];
      let isCorrect = false;
      if (q.type === 'multiple_choice' || q.type === 'true_false') {
         isCorrect = userAnswer === q.correctAnswer;
         if (isCorrect) calculatedScore++;
      }
      return {
        questionId: q.id,
        userAnswer,
        status: statuses[i],
        isCorrect
      };
    });

    setFinalScore(calculatedScore);

    try {
      await fetch('/api/quizzes/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId: quizData.id,
          score: calculatedScore,
          totalMarks: questions.length,
          answers: formattedAnswers,
          warningsCount: warnings,
          timeSpentMs: 0
        })
      });
    } catch (e) {
      console.error('Failed to submit attempt', e);
    }
    
    setIsFinished(true);
    setIsSubmitting(false);
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelect = (option: string) => {
    setAnswers(prev => ({ ...prev, [currentIndex]: option }));
    setStatuses(prev => ({ ...prev, [currentIndex]: 'answered' }));
  };

  const handleTextAnswer = (text: string) => {
    setAnswers(prev => ({ ...prev, [currentIndex]: text }));
    if (text.trim().length > 0) {
      setStatuses(prev => ({ ...prev, [currentIndex]: 'answered' }));
    } else {
      setStatuses(prev => ({ ...prev, [currentIndex]: 'visited' }));
    }
  };

  const jumpToQuestion = (index: number) => {
    if (statuses[currentIndex] !== 'answered' && statuses[currentIndex] !== 'marked_review') {
      setStatuses(prev => ({ ...prev, [currentIndex]: 'skipped' }));
    }
    setCurrentIndex(index);
    if (statuses[index] === 'not_visited') {
      setStatuses(prev => ({ ...prev, [index]: 'visited' }));
    }
  };

  const toggleReview = () => {
    setStatuses(prev => ({ 
      ...prev, 
      [currentIndex]: prev[currentIndex] === 'marked_review' ? (answers[currentIndex] ? 'answered' : 'visited') : 'marked_review' 
    }));
  };

  if (!started) {
    return (
      <div className="bg-[#111] border border-gray-800 rounded-xl p-8 text-center min-h-[500px] flex flex-col justify-center items-center">
        <CheckCircle className="w-16 h-16 text-indigo-500 mb-6" />
        <h2 className="text-3xl font-bold mb-4">Quiz Ready</h2>
        <p className="text-gray-400 mb-8 max-w-lg">
          You have {questions.length} questions to answer. 
          {rules?.antiCheating?.tabSwitch && <span className="block mt-2 text-red-400 font-bold"><AlertTriangle className="w-4 h-4 inline mr-1"/> Anti-cheating is enabled. Do not switch tabs.</span>}
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

  if (isFinished) {
    
    return (
      <div className="bg-[#111] border border-gray-800 rounded-xl p-8 min-h-[500px] max-h-[85vh] overflow-y-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-6">Assessment Submitted</h2>
          <div className="w-32 h-32 rounded-full bg-indigo-900/30 flex items-center justify-center mx-auto mb-8 border-4 border-indigo-500/30">
            <div className="text-center">
              <span className="text-4xl font-bold text-indigo-400">{finalScore}</span>
              <div className="text-sm text-gray-500">Auto-Graded</div>
            </div>
          </div>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            Theory and long-answer questions are currently being graded by the AI. Your final score will be updated shortly in the dashboard.
          </p>
          <button 
            onClick={() => onComplete && onComplete(finalScore)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold transition-colors"
          >
            Return to Dashboard
          </button>
        </div>

        <div className="border-t border-gray-800 pt-8 max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold mb-6">Review Answers</h3>
          <div className="space-y-6">
            {questions.map((q, i) => {
              const userAnswer = answers[i];
              const isCorrect = (q.type === 'multiple_choice' || q.type === 'true_false') 
                                ? userAnswer === q.correctAnswer
                                : null; // For theory questions we don't know yet
              
              return (
                <div key={i} className={`p-6 rounded-xl border-2 ${isCorrect === true ? 'border-green-500/30 bg-green-500/5' : isCorrect === false ? 'border-red-500/30 bg-red-500/5' : 'border-gray-700 bg-gray-800/30'}`}>
                  <div className="flex gap-4 mb-4">
                    <div className="shrink-0 mt-1">
                      {isCorrect === true && <CheckCircle className="w-6 h-6 text-green-500" />}
                      {isCorrect === false && <XCircle className="w-6 h-6 text-red-500" />}
                      {isCorrect === null && <Clock className="w-6 h-6 text-gray-400" />}
                    </div>
                    <div className="w-full">
                      <h4 className="text-lg font-medium mb-2">Q{i + 1}: {q.text || q.questionText}</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="bg-black/40 p-4 rounded-lg border border-gray-800">
                          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Your Answer</div>
                          <div className={isCorrect === true ? 'text-green-400 font-medium' : isCorrect === false ? 'text-red-400 font-medium' : 'text-gray-300'}>{userAnswer || 'Not answered'}</div>
                        </div>
                        <div className="bg-black/40 p-4 rounded-lg border border-gray-800">
                          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{isCorrect === null ? 'Ideal Answer' : 'Correct Answer'}</div>
                          <div className="text-green-400 font-medium whitespace-pre-wrap">{q.correctAnswer}</div>
                        </div>
                      </div>
                      
                      {q.explanation && (
                        <div className="mt-4 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-200 text-sm">
                          <span className="font-bold">Explanation:</span> {q.explanation}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  
  if (!currentQ) {
    return <div className="text-center p-12 text-gray-400">Loading quiz data...</div>;
  }

  const getStatusColor = (status: QuestionStatus) => {
    switch (status) {
      case 'answered': return 'bg-green-600 text-white border-green-500';
      case 'marked_review': return 'bg-yellow-600 text-white border-yellow-500';
      case 'skipped': return 'bg-red-900/50 text-red-300 border-red-800';
      case 'visited': return 'bg-gray-700 text-white border-gray-500';
      default: return 'bg-[#111] text-gray-500 border-gray-800';
    }
  };

  return (
    <div ref={containerRef} className="bg-[#0a0a0a] min-h-[700px] flex flex-col border border-gray-800 rounded-xl overflow-hidden">
      {/* Enterprise Header */}
      <div className="flex justify-between items-center bg-[#111] border-b border-gray-800 p-4">
        <div className="flex items-center gap-4">
          <div className="font-bold text-lg">Quiz Player</div>
          <div className="flex items-center gap-2 text-sm text-gray-400 bg-black px-3 py-1.5 rounded-full border border-gray-800">
            <Save className="w-3.5 h-3.5 text-green-500" /> Saved {lastSaved.toLocaleTimeString()}
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          {rules?.antiCheating?.fullscreen && (
            <div className="text-yellow-500 text-sm flex items-center gap-1 font-bold">
              <Maximize className="w-4 h-4" /> Fullscreen Required
            </div>
          )}
          {warnings > 0 && (
            <div className="text-red-500 text-sm flex items-center gap-1 font-bold">
              <AlertTriangle className="w-4 h-4" /> Warnings: {warnings}/3
            </div>
          )}
          <div className={`flex items-center gap-2 font-mono text-xl font-bold ${timeLeft < 300 ? 'text-red-500' : 'text-indigo-400'}`}>
            <Clock className="w-5 h-5" /> {formatTime(timeLeft)}
          </div>
          <button onClick={handleAutoSubmit} disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors">
            {isSubmitting ? 'Submitting...' : 'Submit Test'}
          </button>
        </div>
      </div>

      {/* Main Content Split */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left: Question & Answer Area */}
        <div className="flex-1 flex flex-col p-8 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <div className="text-gray-400 font-bold tracking-wider uppercase text-sm">Question {currentIndex + 1}</div>
            <button 
              onClick={toggleReview}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${statuses[currentIndex] === 'marked_review' ? 'bg-yellow-600/20 text-yellow-500' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
            >
              <Flag className="w-4 h-4" /> {statuses[currentIndex] === 'marked_review' ? 'Unmark Review' : 'Mark for Review'}
            </button>
          </div>

          <h3 className="text-2xl font-medium mb-8 leading-relaxed">{currentQ.text || currentQ.questionText}</h3>

          <div className="flex-1">
            {(currentQ.type === 'multiple_choice' || currentQ.type === 'true_false') ? (
              <div className="space-y-3">
                {currentQ.options?.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelect(opt)}
                    className={`w-full text-left p-5 rounded-xl border-2 transition-all flex items-center gap-4 ${
                      answers[currentIndex] === opt 
                        ? 'border-indigo-500 bg-indigo-900/20 text-indigo-100' 
                        : 'border-gray-800 bg-[#111] hover:border-gray-600 hover:bg-gray-900'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${answers[currentIndex] === opt ? 'border-indigo-500 bg-indigo-500' : 'border-gray-600'}`}>
                      {answers[currentIndex] === opt && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                    <span className="text-lg">{opt}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="h-full">
                <textarea
                  value={answers[currentIndex] || ''}
                  onChange={e => handleTextAnswer(e.target.value)}
                  placeholder="Type your detailed answer here..."
                  className="w-full h-64 bg-[#111] border-2 border-gray-800 rounded-xl p-5 text-lg text-gray-200 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>
            )}
          </div>

          {/* Previous/Next Footer */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-800">
            <button
              disabled={currentIndex === 0}
              onClick={() => jumpToQuestion(currentIndex - 1)}
              className="disabled:opacity-50 text-gray-400 hover:text-white flex items-center gap-2 font-bold px-4 py-2"
            >
              <ArrowLeft className="w-5 h-5" /> Previous
            </button>
            
            <button
              onClick={() => {
                if (currentIndex < questions.length - 1) {
                  jumpToQuestion(currentIndex + 1);
                } else {
                  handleAutoSubmit();
                }
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-indigo-900/20"
            >
              {currentIndex === questions.length - 1 ? 'Finish Assessment' : 'Next Question'} <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Right: Navigation Grid */}
        <div className="w-80 bg-[#111] border-l border-gray-800 p-6 flex flex-col">
          <h3 className="font-bold text-gray-300 mb-6 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-400" /> Question Navigator
          </h3>
          
          <div className="grid grid-cols-5 gap-2 mb-8">
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => jumpToQuestion(i)}
                className={`h-10 rounded-md border flex items-center justify-center font-bold text-sm transition-all ${getStatusColor(statuses[i] || 'not_visited')} ${currentIndex === i ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-[#111] scale-110 z-10' : ''}`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <div className="mt-auto space-y-3 bg-black/50 p-4 rounded-xl border border-gray-800">
            <div className="text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Legend</div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-4 h-4 rounded bg-green-600 border border-green-500"></div> Answered
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-4 h-4 rounded bg-yellow-600 border border-yellow-500"></div> Marked Review
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-4 h-4 rounded bg-red-900/50 border border-red-800"></div> Skipped
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-4 h-4 rounded bg-gray-700 border border-gray-500"></div> Visited
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-4 h-4 rounded bg-[#111] border border-gray-800"></div> Not Visited
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
