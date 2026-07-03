import React, { useState } from 'react';
import { X, Copy, Check, Link as LinkIcon, Clock, Calendar } from 'lucide-react';

export function ShareExamModal({ quizId, onClose }: { quizId: number; onClose: () => void }) {
  const [timingMode, setTimingMode] = useState<'self_paced' | 'global'>('self_paced');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);

  const generateLink = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/quizzes/${quizId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timingMode,
          startTime: startDate ? new Date(startDate).toISOString() : null,
          endTime: endDate ? new Date(endDate).toISOString() : null
        })
      });
      const data = await res.json();
      if (data.shareableLink) {
        setShareLink(`${window.location.origin}/exam/${data.shareableLink}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#111] border border-gray-800 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 relative">
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-[#1a1a1a]">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-indigo-400" /> Share Exam
          </h2>
          <button 
            onClick={onClose}
            className="hover:bg-gray-800 text-gray-400 hover:text-white p-1.5 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="p-6 flex flex-col gap-6">
          {!shareLink ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Timing Mode</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setTimingMode('self_paced')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-colors ${
                      timingMode === 'self_paced' ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400' : 'bg-[#1a1a1a] border-gray-800 text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    <Clock className="w-5 h-5" />
                    <span className="text-sm font-bold">Self-Paced</span>
                  </button>
                  <button
                    onClick={() => setTimingMode('global')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-colors ${
                      timingMode === 'global' ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400' : 'bg-[#1a1a1a] border-gray-800 text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    <Calendar className="w-5 h-5" />
                    <span className="text-sm font-bold">Global Scheduled</span>
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {timingMode === 'self_paced' 
                    ? "The student's timer will begin when they open the exam link."
                    : "All students must take the exam within the specific time window below."}
                </p>
              </div>

              {timingMode === 'global' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Start Time</label>
                    <input 
                      type="datetime-local" 
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="w-full bg-[#1a1a1a] border border-gray-800 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-indigo-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">End Time</label>
                    <input 
                      type="datetime-local" 
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      className="w-full bg-[#1a1a1a] border border-gray-800 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-indigo-500" 
                    />
                  </div>
                </div>
              )}

              <button 
                onClick={generateLink}
                disabled={loading || (timingMode === 'global' && (!startDate || !endDate))}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white font-bold py-3 rounded-xl transition-colors"
              >
                {loading ? 'Generating...' : 'Generate Share Link'}
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/30">
                <Check className="w-6 h-6 text-green-400" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-white">Link Generated!</h3>
                <p className="text-sm text-gray-400 mt-1">Share this link with your students. They can access the exam by entering their Name and Roll Number.</p>
              </div>
              
              <div className="w-full flex items-center gap-2 mt-2">
                <input 
                  type="text" 
                  readOnly 
                  value={shareLink} 
                  className="flex-1 bg-[#1a1a1a] border border-gray-800 rounded-lg p-3 text-sm text-gray-300 focus:outline-none"
                />
                <button 
                  onClick={copyLink}
                  className="bg-gray-800 hover:bg-gray-700 p-3 rounded-lg text-white transition-colors"
                >
                  {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
