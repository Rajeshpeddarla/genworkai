"use client";

import React from 'react';
import { BookOpen, Star, AlertCircle } from 'lucide-react';

export function StudyNotesRenderer({ data }: { data: any }) {
  if (!data || !data.sections) {
    return <div className="text-gray-500">Invalid notes data.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-24">
      {/* Header */}
      <div className="border-b border-gray-800 pb-8">
        <h1 className="text-4xl font-bold text-white mb-4">{data.title || 'Study Notes'}</h1>
        {data.summary && (
          <div className="text-xl text-indigo-200 leading-relaxed font-light">
            {data.summary}
          </div>
        )}
      </div>

      {/* Sections */}
      <div className="space-y-16">
        {data.sections.map((section: any, idx: number) => (
          <section key={idx} className="scroll-mt-24">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="bg-indigo-500/20 text-indigo-400 w-8 h-8 rounded-lg flex items-center justify-center text-sm">
                {idx + 1}
              </span>
              {section.heading}
            </h2>
            
            <div className="prose prose-invert prose-indigo max-w-none text-gray-300 leading-relaxed mb-8 whitespace-pre-wrap">
              {section.content}
            </div>

            {/* Highlights & Terms */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              {section.importantHighlights && section.importantHighlights.length > 0 && (
                <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    Key Highlights
                  </h3>
                  <ul className="space-y-3">
                    {section.importantHighlights.map((hl: string, i: number) => (
                      <li key={i} className="text-sm text-gray-300 flex items-start gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500/50 mt-1.5 shrink-0"></span>
                        {hl}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {section.keyTerms && section.keyTerms.length > 0 && (
                <div className="bg-indigo-900/10 border border-indigo-500/20 rounded-xl p-6">
                  <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    Key Terms
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {section.keyTerms.map((term: string, i: number) => (
                      <span key={i} className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-lg text-sm border border-indigo-500/30">
                        {term}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
