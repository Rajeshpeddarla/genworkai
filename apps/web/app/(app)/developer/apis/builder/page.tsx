'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ApiBuilderStudio() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Endpoint configuration state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [method, setMethod] = useState('POST');
  
  // Workflow steps state
  const [steps, setSteps] = useState([
    "Parse Request JSON (Input Schema)",
    "Retrieve Knowledge (RAG)",
    "LLM Processing (System Prompt)",
    "Format Response JSON (Output Schema)"
  ]);

  // Knowledge Sources state
  const [knowledgeBases, setKnowledgeBases] = useState<any[]>([]);
  const [isLoadingKbs, setIsLoadingKbs] = useState(true);
  const [selectedKbs, setSelectedKbs] = useState<string[]>([]);

  useEffect(() => {
    const fetchKbs = async () => {
      try {
        const response = await fetch('/api/knowledge/list');
        const res = await response.json();
        if (res.kbs) {
          setKnowledgeBases(res.kbs);
        }
      } catch (error) {
        console.error("Failed to fetch KBs:", error);
      } finally {
        setIsLoadingKbs(false);
      }
    };
    fetchKbs();
  }, []);

  const toggleKb = (id: string) => {
    setSelectedKbs(prev => 
      prev.includes(id) ? prev.filter(kId => kId !== id) : [...prev, id]
    );
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/api-builder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });
      
      const res = await response.json();
      if (res.success && res.data) {
        try {
          const parsed = JSON.parse(res.data);
          if (parsed.name) setName(parsed.name);
          if (parsed.slug) setSlug(parsed.slug);
          if (parsed.method) setMethod(parsed.method);
          if (parsed.steps && Array.isArray(parsed.steps)) setSteps(parsed.steps);
        } catch (err) {
          console.error("Failed to parse AI response:", err);
        }
      } else {
        console.error("Failed to generate:", res.error);
        alert(res.error || "Failed to generate API configuration");
      }
    } catch (error) {
      console.error("Error calling generate API:", error);
      alert("Error calling generate API");
    } finally {
      setIsGenerating(false);
    }
  };

  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = async () => {
    if (!name || !slug) {
      alert("Please provide a Name and Slug for your API endpoint.");
      return;
    }
    
    setIsPublishing(true);
    try {
      const response = await fetch('/api/developer/apis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          slug,
          method,
          steps,
          knowledgeSources: selectedKbs
        }),
      });
      
      const res = await response.json();
      if (res.success) {
        router.push('/developer/apis');
      } else {
        alert(res.error || "Failed to publish API");
      }
    } catch (error) {
      console.error("Error publishing API:", error);
      alert("An unexpected error occurred while publishing.");
    } finally {
      setIsPublishing(false);
    }
  };
  
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">API Builder Studio</h1>
      <p className="text-neutral-500 mb-8">Describe what you want to build and we will generate the endpoint workflow.</p>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 mb-8">
        <label className="block text-sm font-medium mb-2">AI Generator</label>
        <div className="flex gap-4">
          <input 
            type="text" 
            placeholder="e.g. Create an API that generates a 30 day GATE study plan based on the uploaded syllabus"
            className="flex-1 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleGenerate();
              }
            }}
          />
          <button 
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="bg-violet-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[160px]"
          >
            {isGenerating ? 'Generating...' : 'Auto-Generate'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-4">Endpoint Configuration</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input 
                  type="text" 
                  placeholder="Study Plan Generator" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-2" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Slug</label>
                <input 
                  type="text" 
                  placeholder="study-plan-generator" 
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-2" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">HTTP Method</label>
                <select 
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-2"
                >
                  <option value="POST">POST</option>
                  <option value="GET">GET</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-4">Knowledge Sources</h3>
            <div className="space-y-3">
              {isLoadingKbs ? (
                <div className="text-sm text-neutral-500 py-4 text-center">Loading knowledge bases...</div>
              ) : knowledgeBases.length === 0 ? (
                <div className="border border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl p-8 text-center text-neutral-500">
                  No knowledge bases found. Create one first!
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2">
                  {knowledgeBases.map((kb) => (
                    <label key={kb.id} className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors">
                      <input 
                        type="checkbox" 
                        checked={selectedKbs.includes(kb.id)}
                        onChange={() => toggleKb(kb.id)}
                        className="w-4 h-4 text-violet-600 rounded border-neutral-300 focus:ring-violet-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{kb.name}</div>
                        <div className="text-xs text-neutral-500">{kb.description || 'No description'}</div>
                      </div>
                      <div className="text-xs bg-neutral-200 dark:bg-neutral-800 px-2 py-1 rounded-md">
                        {kb.documentCount || 0} docs
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-4">Workflow Execution</h3>
            <div className="space-y-3">
              {steps.map((step, index) => {
                // Determine color based on index
                const colors = [
                  "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
                  "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
                  "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
                  "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
                  "bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400",
                  "bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400",
                ];
                const colorClass = colors[index % colors.length];

                return (
                  <div key={index} className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${colorClass}`}>
                      {index + 1}
                    </div>
                    <div>{step}</div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="flex justify-end gap-4 mt-8">
            <button 
              onClick={() => router.push('/developer/apis')}
              className="px-6 py-2.5 rounded-xl font-medium border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800"
            >
              Cancel
            </button>
            <button 
              onClick={handlePublish}
              disabled={isPublishing}
              className="bg-black dark:bg-white text-white dark:text-black px-6 py-2.5 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed min-w-[160px]"
            >
              {isPublishing ? "Publishing..." : "Publish Endpoint"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
