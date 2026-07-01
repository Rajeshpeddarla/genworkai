import React, { useState, useEffect } from 'react';
import { Database, FileText, Settings, Settings2, Sparkles, CheckCircle, Clock } from 'lucide-react';

type WizardStep = 1 | 2 | 3 | 4 | 5;

export function QuizGenerationWizard({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<WizardStep>(1);
  const [kbs, setKbs] = useState<any[]>([]);
  const [loadingKbs, setLoadingKbs] = useState(true);

  // Form State
  const [kbId, setKbId] = useState<number | null>(null);
  const [scope, setScope] = useState<{ type: string, value: any }>({ type: 'entire_kb', value: '' });
  
  const [config, setConfig] = useState({
    count: 10,
    difficulty: 'Medium',
    bloomLevel: 'Understanding',
    questionTypes: ['multiple_choice']
  });

  const [rules, setRules] = useState({
    timePerQuestion: 60, // seconds, 0 for off
    totalTime: 0, // seconds, 0 for off
    randomizeQuestions: true,
    randomizeOptions: true,
    passingPercentage: 70,
    attemptsAllowed: 1, // 0 for unlimited
    showAnswersAfter: true,
    showScoreImmediately: true,
    antiCheating: {
      fullscreen: false,
      tabSwitch: false
    }
  });

  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetch('/api/knowledge/list')
      .then(r => r.json())
      .then(data => {
        setKbs(data.kbs || []);
        setLoadingKbs(false);
      })
      .catch(e => {
        console.error(e);
        setLoadingKbs(false);
      });
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      // In Phase 1, we simulate generation or call a specific API
      const res = await fetch('/api/quizzes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kbId,
          scope,
          config,
          rules: { ...rules, persona: localStorage.getItem('automationPersona') || 'General' }
        })
      });

      if (!res.ok) {
        throw new Error('Failed to generate quiz');
      }
      
      onComplete();
    } catch (e) {
      console.error(e);
      alert('Error generating quiz.');
    } finally {
      setGenerating(false);
    }
  };

  const nextStep = () => setStep(s => Math.min(5, s + 1) as WizardStep);
  const prevStep = () => setStep(s => Math.max(1, s - 1) as WizardStep);

  return (
    <div className="max-w-4xl mx-auto w-full flex flex-col h-full pb-8">
      {/* Wizard Header Progress */}
      <div className="flex justify-between items-center mb-8 relative shrink-0">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-800 -z-10 rounded-full"></div>
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-indigo-600 -z-10 rounded-full transition-all duration-300" style={{ width: `${((step - 1) / 4) * 100}%` }}></div>
        
        {[1, 2, 3, 4, 5].map((s) => (
          <div key={s} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-4 border-[#111] transition-colors ${step >= s ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
            {s}
          </div>
        ))}
      </div>

      <div className="bg-[#1a1a1a] border border-gray-800 p-8 rounded-2xl flex-1 overflow-y-auto no-scrollbar">
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2"><Database className="text-indigo-400" /> Select Knowledge Base</h2>
            <p className="text-gray-400 mb-6">Choose the core knowledge base to extract questions from.</p>
            
            {loadingKbs ? (
              <div className="text-gray-500">Loading Knowledge Bases...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {kbs.map(kb => (
                  <button
                    key={kb.id}
                    onClick={() => { setKbId(kb.id); nextStep(); }}
                    className={`p-5 text-left rounded-xl border transition-all ${kbId === kb.id ? 'bg-indigo-600/10 border-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.15)]' : 'bg-black/40 border-gray-800 hover:border-gray-600'}`}
                  >
                    <div className="font-bold text-lg">{kb.name}</div>
                    <div className="text-sm text-gray-500 mt-1 line-clamp-2">{kb.description || 'No description provided'}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2"><FileText className="text-indigo-400" /> Choose Scope</h2>
            <p className="text-gray-400 mb-6">Narrow down the specific documents or topics.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {[
                { id: 'entire_kb', label: 'Entire Knowledge Base', desc: 'Use all documents' },
                { id: 'folder', label: 'Specific Folder', desc: 'Select a folder path' },
                { id: 'files', label: 'Selected Files', desc: 'Pick exact files' },
                { id: 'topic', label: 'Topic Name', desc: 'Type a specific concept' }
              ].map(s => (
                <button
                  key={s.id}
                  onClick={() => setScope({ type: s.id, value: s.id === 'files' ? [] : '' })}
                  className={`p-4 text-left rounded-xl border transition-all ${scope.type === s.id ? 'bg-indigo-600/10 border-indigo-500' : 'bg-black/40 border-gray-800 hover:border-gray-600'}`}
                >
                  <div className="font-bold">{s.label}</div>
                  <div className="text-sm text-gray-500 mt-1">{s.desc}</div>
                </button>
              ))}
            </div>

            {scope.type === 'topic' && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Topic Name</label>
                <input 
                  type="text" 
                  value={scope.value}
                  onChange={e => setScope({ ...scope, value: e.target.value })}
                  placeholder="e.g. Advanced Routing, Photosynthesis"
                  className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            {scope.type === 'files' && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-sm font-medium text-gray-400 mb-2">Select Document(s)</label>
                {(!kbs.find(k => k.id === kbId)?.documents || kbs.find(k => k.id === kbId)?.documents.length === 0) ? (
                  <p className="text-sm text-gray-500 p-4 border border-gray-800 rounded-lg bg-black/30">No documents found in this Knowledge Base.</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-2 no-scrollbar">
                    {kbs.find(k => k.id === kbId)?.documents.map((doc: any) => {
                      const selectedFiles = Array.isArray(scope.value) ? scope.value : [];
                      const isSelected = selectedFiles.includes(doc.id);
                      return (
                        <label key={doc.id} className="flex items-center gap-3 p-3 bg-black/50 border border-gray-800 rounded-lg cursor-pointer hover:bg-gray-900 transition-colors">
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            onChange={(e) => {
                              const newSelection = e.target.checked 
                                ? [...selectedFiles, doc.id] 
                                : selectedFiles.filter((id: any) => id !== doc.id);
                              setScope({ ...scope, value: newSelection });
                            }}
                            className="w-4 h-4 text-indigo-600 rounded bg-gray-900 border-gray-700 focus:ring-indigo-600 focus:ring-2"
                          />
                          <span className="text-sm font-medium truncate">{doc.title || doc.sourceUrl || 'Untitled Document'}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {scope.type === 'folder' && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-sm font-medium text-gray-400 mb-2">Folder Path</label>
                <input 
                  type="text" 
                  value={scope.value}
                  onChange={e => setScope({ ...scope, value: e.target.value })}
                  placeholder="e.g. /training/onboarding"
                  className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2"><Settings2 className="text-indigo-400" /> Question Configuration</h2>
            <p className="text-gray-400 mb-6">Define the structure and difficulty of the questions.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Number of Questions</label>
                <input 
                  type="number" 
                  value={config.count}
                  onChange={e => setConfig({ ...config, count: parseInt(e.target.value) || 10 })}
                  className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                  min="1" max="50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Difficulty</label>
                <select 
                  value={config.difficulty}
                  onChange={e => setConfig({ ...config, difficulty: e.target.value })}
                  className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option>Beginner</option>
                  <option>Medium</option>
                  <option>Hard</option>
                  <option>Expert</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Bloom's Taxonomy Level</label>
                <select 
                  value={config.bloomLevel}
                  onChange={e => setConfig({ ...config, bloomLevel: e.target.value })}
                  className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option>Remembering</option>
                  <option>Understanding</option>
                  <option>Applying</option>
                  <option>Analyzing</option>
                  <option>Evaluating</option>
                  <option>Creating</option>
                  <option>Mixed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Question Types</label>
                <div className="space-y-2 pr-2">
                  {[
                    { id: 'multiple_choice', label: 'Multiple Choice' },
                    { id: 'multiple_select', label: 'Multiple Select' },
                    { id: 'true_false', label: 'True / False' },
                    { id: 'theory', label: 'Long Answer (AI Graded)' }
                  ].map(t => (
                    <label key={t.id} className="flex items-center gap-3 p-2 bg-black/50 border border-gray-800 rounded-lg cursor-pointer hover:bg-gray-900 transition-colors">
                      <input 
                        type="checkbox" 
                        checked={config.questionTypes.includes(t.id)}
                        onChange={e => {
                          if (e.target.checked) setConfig({ ...config, questionTypes: [...config.questionTypes, t.id] });
                          else setConfig({ ...config, questionTypes: config.questionTypes.filter(x => x !== t.id) });
                        }}
                        className="w-4 h-4 text-indigo-600 rounded bg-gray-900 border-gray-700 focus:ring-indigo-600 focus:ring-2"
                      />
                      <span className="text-sm font-medium">{t.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2"><Settings className="text-indigo-400" /> Quiz Rules & Anti-Cheating</h2>
            <p className="text-gray-400 mb-6">Configure timing, grading, and proctoring rules.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div>
                <h3 className="font-bold text-gray-300 border-b border-gray-800 pb-2 mb-4">Timing & Grading</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-sm text-gray-400">Time per Question (sec)</label>
                    <input type="number" value={rules.timePerQuestion} onChange={e => setRules({...rules, timePerQuestion: parseInt(e.target.value)||0})} className="w-20 bg-black border border-gray-700 rounded px-2 py-1 text-center" />
                  </div>
                  <div className="flex justify-between items-center">
                    <label className="text-sm text-gray-400">Passing Percentage (%)</label>
                    <input type="number" value={rules.passingPercentage} onChange={e => setRules({...rules, passingPercentage: parseInt(e.target.value)||70})} className="w-20 bg-black border border-gray-700 rounded px-2 py-1 text-center" />
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={rules.randomizeQuestions} onChange={e => setRules({...rules, randomizeQuestions: e.target.checked})} className="w-4 h-4 rounded text-indigo-600" />
                    <span className="text-sm">Randomize Questions</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={rules.showScoreImmediately} onChange={e => setRules({...rules, showScoreImmediately: e.target.checked})} className="w-4 h-4 rounded text-indigo-600" />
                    <span className="text-sm">Show Score Immediately</span>
                  </label>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-gray-300 border-b border-gray-800 pb-2 mb-4 flex items-center gap-2">Proctoring <span className="text-xs bg-red-900/50 text-red-400 px-2 py-0.5 rounded-full">Strict</span></h3>
                <div className="space-y-4">
                  <label className="flex items-start gap-3 cursor-pointer bg-black/30 p-3 rounded-lg border border-gray-800 hover:border-gray-700">
                    <input type="checkbox" checked={rules.antiCheating.fullscreen} onChange={e => setRules({...rules, antiCheating: {...rules.antiCheating, fullscreen: e.target.checked}})} className="w-4 h-4 mt-1 rounded text-indigo-600" />
                    <div>
                      <div className="text-sm font-medium">Require Fullscreen</div>
                      <div className="text-xs text-gray-500 mt-0.5">Quiz will pause and warn if user exits fullscreen.</div>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer bg-black/30 p-3 rounded-lg border border-gray-800 hover:border-gray-700">
                    <input type="checkbox" checked={rules.antiCheating.tabSwitch} onChange={e => setRules({...rules, antiCheating: {...rules.antiCheating, tabSwitch: e.target.checked}})} className="w-4 h-4 mt-1 rounded text-indigo-600" />
                    <div>
                      <div className="text-sm font-medium">Tab Switch Detection</div>
                      <div className="text-xs text-gray-500 mt-0.5">Issue warnings if focus is lost (3 strikes).</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300 text-center py-8">
            <Sparkles className="w-16 h-16 text-indigo-500 mx-auto mb-4 animate-pulse" />
            <h2 className="text-3xl font-bold mb-4">Ready to Generate</h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Our AI will now analyze your Knowledge Base and strictly adhere to your curriculum rules to craft a high-quality enterprise quiz.
            </p>

            <div className="bg-black/50 border border-gray-800 rounded-xl p-6 max-w-sm mx-auto mb-8 text-left space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400 text-sm">Number of Questions</span>
                <span className="font-bold">{config.count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 text-sm">Target Difficulty</span>
                <span className="font-bold text-indigo-400">{config.difficulty}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 text-sm">Estimated Credits</span>
                <span className="font-bold text-yellow-500 flex items-center gap-1">~{config.count * 2} <Database className="w-3 h-3" /></span>
              </div>
            </div>

            <button 
              onClick={handleGenerate} 
              disabled={generating}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center mx-auto min-w-[250px]"
            >
              {generating ? (
                <span className="flex items-center gap-2"><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Generating...</span>
              ) : (
                'Generate Quiz Now'
              )}
            </button>
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="flex justify-between items-center mt-6 shrink-0">
        <button 
          onClick={prevStep}
          disabled={step === 1 || generating}
          className="px-6 py-2.5 rounded-lg font-medium text-gray-400 hover:text-white transition-colors disabled:opacity-0"
        >
          Back
        </button>
        {step < 5 && (
          <button 
            onClick={nextStep}
            disabled={step === 1 && !kbId}
            className="bg-gray-100 text-black hover:bg-white px-6 py-2.5 rounded-lg font-bold transition-colors disabled:opacity-50"
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
}
