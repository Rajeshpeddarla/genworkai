"use client";

import React, { useState } from 'react';
import { Database, FileText, ChevronRight, CheckCircle, Zap, Activity, AlertTriangle, ArrowLeft } from 'lucide-react';

export function BaseGenerationWizard({
  moduleName,
  wizardConfig,
  templates,
  initialTemplate,
  sources,
  onComplete
}: {
  moduleName: string;
  wizardConfig: any;
  templates?: any[];
  initialTemplate?: any;
  sources: any[];
  onComplete: () => void;
}) {
  const [step, setStep] = useState(1);
  const [selectedSource, setSelectedSource] = useState<any>(null);
  const [activeTemplate, setActiveTemplate] = useState<any>(initialTemplate || null);
  const [configValues, setConfigValues] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Determine total steps: Source Selection (1) + Config Steps (length) + Preview (1)
  const hasSources = sources && sources.length > 0;
  const configStepCount = wizardConfig.steps?.length || 1;
  const totalSteps = (hasSources ? 1 : 0) + configStepCount + 1;

  const currentStepType = () => {
    let current = step;
    if (hasSources) {
      if (current === 1) return 'source';
      current--;
    }
    if (current <= configStepCount) return `config_${current - 1}`;
    return 'preview';
  };

  const stepType = currentStepType();

  const handleNext = () => {
    if (stepType.startsWith('config_') && step === (hasSources ? 1 : 0) + configStepCount) {
      // Moving from last config to preview
      generatePreview();
    } else {
      setStep(s => s + 1);
    }
  };

  const handleBack = () => {
    setStep(s => s - 1);
    setError(null);
  };

  const generatePreview = () => {
    // Simulate cost calculation or we could call an API
    let est = 3;
    if (moduleName === 'Lesson Planner' || moduleName === 'Question Papers') est = 5;
    if (moduleName === 'Study Center') est = 2;

    setPreviewData({
      estimatedCredits: est,
      provider: 'DeepSeek',
      billingMode: 'Platform AI',
      template: activeTemplate ? activeTemplate.name : 'Custom',
    });
    setStep(s => s + 1);
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    // Build the prompt from config values
    const promptEntries = Object.entries(configValues).map(([k, v]) => `${k}: ${v}`).join(', ');
    const prompt = `Generate using the following parameters: ${promptEntries}`;

    try {
      const res = await fetch('/api/generation/engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: moduleName,
          template: activeTemplate ? activeTemplate.name : 'Custom',
          prompt,
          kbId: selectedSource ? selectedSource.internalId : null,
          configuration: configValues
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate');

      onComplete();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* Progress Bar */}
      <div className="mb-8 flex items-center justify-between relative">
        <div className="absolute left-0 top-1/2 w-full h-0.5 bg-gray-800 -z-10"></div>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
            step > i + 1 ? 'bg-indigo-600 text-white' : step === i + 1 ? 'bg-indigo-500 text-white ring-4 ring-indigo-500/20' : 'bg-gray-800 text-gray-500'
          }`}>
            {step > i + 1 ? <CheckCircle className="w-4 h-4" /> : i + 1}
          </div>
        ))}
      </div>

      <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-8 shadow-2xl">
        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-900/50 p-4 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="text-sm text-red-200">{error}</div>
          </div>
        )}

        {stepType === 'source' && (
          <div className="animate-in fade-in slide-in-from-right-4">
            {templates && templates.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2"><FileText className="text-indigo-400 w-5 h-5" /> Select Template (Optional)</h2>
                <p className="text-gray-400 mb-4">Choose a template for your generation or proceed with default configuration.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates.map((tpl: any) => (
                    <div 
                      key={tpl.id} 
                      onClick={() => setActiveTemplate(tpl)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        activeTemplate?.id === tpl.id ? 'bg-indigo-600/10 border-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.15)]' : 'bg-[#111] border-gray-800 hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <tpl.icon className={`w-5 h-5 ${activeTemplate?.id === tpl.id ? 'text-indigo-400' : 'text-gray-400'}`} />
                        <div className="font-bold text-white">{tpl.name}</div>
                      </div>
                      <div className="text-xs text-gray-500 line-clamp-2">{tpl.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2"><Database className="text-indigo-400 w-5 h-5" /> Select Knowledge Source</h2>
            <p className="text-gray-400 mb-6">Choose the knowledge base or database to pull context from.</p>
            
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {sources.filter(s => s.type === 'knowledge_base').map(src => (
                <div 
                  key={src.id}
                  onClick={() => setSelectedSource(src)}
                  className={`p-4 rounded-xl border flex items-center gap-4 cursor-pointer transition-colors ${
                    selectedSource?.id === src.id ? 'bg-indigo-600/10 border-indigo-500' : 'bg-[#111] border-gray-800 hover:border-gray-600'
                  }`}
                >
                  <Database className={`w-6 h-6 ${selectedSource?.id === src.id ? 'text-indigo-400' : 'text-gray-500'}`} />
                  <div>
                    <div className="font-bold text-white">{src.name}</div>
                    <div className="text-xs text-gray-500">{src.documentCount || 0} Documents</div>
                  </div>
                </div>
              ))}
              {sources.length === 0 && (
                <div className="text-center p-8 border border-dashed border-gray-800 rounded-xl text-gray-500">
                  No Knowledge Bases found. You can proceed without one, but the AI will use general knowledge.
                </div>
              )}
            </div>
            
            <div className="mt-8 flex justify-between">
              <button className="px-6 py-2 text-gray-400 hover:text-white transition-colors" onClick={() => onComplete()}>Cancel</button>
              <button 
                onClick={handleNext}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-bold transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {stepType.startsWith('config_') && (
          <div className="animate-in fade-in slide-in-from-right-4">
            <h2 className="text-2xl font-bold text-white mb-2">Configure Generation</h2>
            <p className="text-gray-400 mb-6">Set the parameters for your {moduleName}.</p>
            
            <div className="space-y-6">
              {wizardConfig.steps[parseInt(stepType.split('_')[1] || '0')].fields.map((field: any) => (
                <div key={field.name}>
                  <label className="block text-sm font-bold text-gray-300 mb-2">{field.label}</label>
                  {field.type === 'select' ? (
                    <select 
                      className="w-full bg-[#111] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                      value={configValues[field.name] || ''}
                      onChange={e => setConfigValues({...configValues, [field.name]: e.target.value})}
                    >
                      <option value="" disabled>Select an option...</option>
                      {field.options?.map((opt: string) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : field.type === 'number' ? (
                    <input 
                      type="number"
                      className="w-full bg-[#111] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                      value={configValues[field.name] || ''}
                      onChange={e => setConfigValues({...configValues, [field.name]: e.target.value})}
                      placeholder={field.placeholder}
                    />
                  ) : (
                    <input 
                      type="text"
                      className="w-full bg-[#111] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                      value={configValues[field.name] || ''}
                      onChange={e => setConfigValues({...configValues, [field.name]: e.target.value})}
                      placeholder={field.placeholder}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-between">
              <button className="px-6 py-2 text-gray-400 hover:text-white transition-colors" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4 inline mr-2" /> Back
              </button>
              <button 
                onClick={handleNext}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-bold transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {stepType === 'preview' && previewData && (
          <div className="animate-in fade-in slide-in-from-right-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-indigo-500/20 p-3 rounded-xl">
                <Zap className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Generation Preview</h2>
                <p className="text-gray-400">Review the estimated cost and details before generating.</p>
              </div>
            </div>

            <div className="bg-[#111] border border-gray-800 rounded-xl p-6 mb-8">
              <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Module</div>
                  <div className="font-bold text-white">{moduleName}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Template</div>
                  <div className="font-bold text-white">{previewData.template}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Estimated Credits</div>
                  <div className="font-bold text-indigo-400 text-xl">{previewData.estimatedCredits}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">AI Provider</div>
                  <div className="font-bold text-white">{previewData.provider}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Billing Mode</div>
                  <div className="font-bold text-white">{previewData.billingMode}</div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <button className="px-6 py-2 text-gray-400 hover:text-white transition-colors" onClick={handleBack} disabled={loading}>
                <ArrowLeft className="w-4 h-4 inline mr-2" /> Back
              </button>
              <button 
                onClick={handleGenerate}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold transition-colors flex items-center gap-2 shadow-lg shadow-indigo-900/20 disabled:opacity-50"
              >
                {loading ? <Activity className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                {loading ? 'Generating...' : 'Generate Now'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
