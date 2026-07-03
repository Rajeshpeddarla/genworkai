"use client";
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { PublicQuizPlayer } from './PublicQuizPlayer';
import { User, Hash, AlertCircle, Loader2 } from 'lucide-react';

export default function PublicExamPage() {
  const params = useParams();
  const linkId = params.linkId as string;

  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [completed, setCompleted] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [totalMarks, setTotalMarks] = useState(0);

  useEffect(() => {
    fetch(`/api/exam/${linkId}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setExam(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load exam details.');
        setLoading(false);
      });
  }, [linkId]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoining(true);
    setJoinError('');

    try {
      const res = await fetch(`/api/exam/${linkId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestName: name, guestRollNumber: rollNumber })
      });
      const data = await res.json();
      if (data.error) {
        setJoinError(data.error);
      } else {
        setAttemptId(data.attemptId);
        setQuestions(data.questions);
      }
    } catch (err) {
      setJoinError('An error occurred. Please try again.');
    } finally {
      setJoining(false);
    }
  };

  const handleComplete = (score: number, total: number) => {
    setFinalScore(score);
    setTotalMarks(total);
    setCompleted(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="bg-[#111] border border-red-900/50 p-8 rounded-2xl max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Unavailable</h2>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="bg-[#111] border border-gray-800 p-8 rounded-2xl max-w-md w-full text-center shadow-2xl">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30">
            <span className="text-3xl">🎉</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Exam Submitted</h2>
          <p className="text-gray-400 mb-6">Your responses have been recorded successfully.</p>
          
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 mb-8">
            <div className="text-sm text-gray-500 uppercase font-bold tracking-wider mb-1">Your Score</div>
            <div className="text-5xl font-black text-indigo-400">
              {finalScore} <span className="text-2xl text-gray-500">/ {totalMarks}</span>
            </div>
          </div>
          
          <p className="text-sm text-gray-500">You may now close this tab.</p>
        </div>
      </div>
    );
  }

  if (attemptId && questions.length > 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] p-4 md:p-8 flex items-center justify-center">
        <div className="w-full max-w-6xl h-[85vh]">
          <PublicQuizPlayer 
            linkId={linkId}
            attemptId={attemptId}
            questions={questions}
            rules={exam.rules}
            timingMode={exam.timingMode}
            endTime={exam.endTime}
            onComplete={handleComplete}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-4xl w-full grid md:grid-cols-2 gap-8 items-center">
        {/* Left Side: Exam Info */}
        <div className="text-left space-y-6 p-8">
          <div className="inline-block bg-indigo-500/10 text-indigo-400 font-bold px-4 py-1.5 rounded-full border border-indigo-500/20 text-sm mb-2">
            Public Assessment
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white leading-tight">
            {exam.title}
          </h1>
          <p className="text-xl text-gray-400 leading-relaxed">
            {exam.description || "Please enter your details to begin the exam."}
          </p>
          
          <div className="bg-[#111] border border-gray-800 rounded-xl p-5 space-y-4 mt-8">
            <h3 className="font-bold text-white mb-2">Exam Rules & Info</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              {exam.timingMode === 'global' ? (
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400 font-bold mt-0.5">•</span>
                  <span>This exam is scheduled. It ends at <strong>{new Date(exam.endTime).toLocaleString()}</strong>.</span>
                </li>
              ) : (
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400 font-bold mt-0.5">•</span>
                  <span>This is a self-paced exam. Your timer will start once you join.</span>
                </li>
              )}
              {exam.rules?.antiCheating?.tabSwitch && (
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold mt-0.5">•</span>
                  <span>Anti-cheating is enabled. Switching tabs will trigger a warning.</span>
                </li>
              )}
              {exam.rules?.totalTime && (
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400 font-bold mt-0.5">•</span>
                  <span>Total Time: {Math.floor(exam.rules.totalTime / 60)} minutes.</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Right Side: Join Form */}
        <div className="bg-[#111] border border-gray-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"></div>
          <h2 className="text-2xl font-bold text-white mb-6">Candidate Details</h2>
          
          {joinError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl mb-6 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {joinError}
            </div>
          )}

          <form onSubmit={handleJoin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-gray-500" />
                </div>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-gray-800 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-gray-600"
                  placeholder="e.g. John Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Roll Number / ID</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Hash className="w-5 h-5 text-gray-500" />
                </div>
                <input 
                  type="text" 
                  required
                  value={rollNumber}
                  onChange={e => setRollNumber(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-gray-800 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-gray-600"
                  placeholder="e.g. CS-2024-001"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={joining || !name || !rollNumber}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-indigo-900/50 mt-4 flex justify-center items-center gap-2"
            >
              {joining ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Joining...</>
              ) : (
                'Join Exam'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
