"use client";

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Brain, Lightbulb, RefreshCw } from 'lucide-react';

export function FlashcardRenderer({ data }: { data: any }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (!data || !data.cards || data.cards.length === 0) {
    return <div className="text-gray-500">No flashcards generated.</div>;
  }

  const cards = data.cards;
  const currentCard = cards[currentIndex];

  const handleNext = () => {
    setFlipped(false);
    setTimeout(() => {
      setCurrentIndex((i) => (i + 1) % cards.length);
    }, 150);
  };

  const handlePrev = () => {
    setFlipped(false);
    setTimeout(() => {
      setCurrentIndex((i) => (i - 1 + cards.length) % cards.length);
    }, 150);
  };

  const getDifficultyColor = (diff: string) => {
    if (diff === 'easy') return 'bg-green-500/20 text-green-400';
    if (diff === 'medium') return 'bg-yellow-500/20 text-yellow-400';
    return 'bg-red-500/20 text-red-400';
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col items-center">
      <div className="w-full flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Brain className="w-5 h-5 text-indigo-400" />
          {data.topic || 'Flashcards'}
        </h3>
        <div className="text-sm font-medium text-gray-500">
          Card {currentIndex + 1} of {cards.length}
        </div>
      </div>

      {/* The Card */}
      <div 
        className="relative w-full aspect-[4/3] cursor-pointer"
        style={{ perspective: '1000px' }}
        onClick={() => setFlipped(!flipped)}
      >
        <div 
          className="w-full h-full absolute transition-all duration-500"
          style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0)' }}
        >
          {/* Front */}
          <div 
            className="absolute w-full h-full bg-[#1a1a1a] border border-gray-800 rounded-2xl p-8 flex flex-col justify-center items-center text-center shadow-2xl hover:border-indigo-500/50 transition-colors"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <span className={`absolute top-4 right-4 px-2 py-1 text-xs font-bold rounded ${getDifficultyColor(currentCard.difficulty)} capitalize`}>
              {currentCard.difficulty}
            </span>
            <div className="text-2xl font-bold text-white leading-relaxed">
              {currentCard.question}
            </div>
            <div className="absolute bottom-6 text-sm text-gray-500 flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Click to flip
            </div>
          </div>

          {/* Back */}
          <div 
            className="absolute w-full h-full bg-indigo-900/20 border border-indigo-500/50 rounded-2xl p-8 flex flex-col justify-center items-center text-center shadow-2xl"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <div className="text-xl font-bold text-white mb-6">
              {currentCard.answer}
            </div>
            {currentCard.explanation && (
              <div className="bg-black/40 p-4 rounded-xl border border-indigo-500/30 text-sm text-indigo-200 flex items-start gap-3 text-left w-full overflow-y-auto max-h-[50%]">
                <Lightbulb className="w-5 h-5 shrink-0 text-indigo-400 mt-0.5" />
                <div>{currentCard.explanation}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-4 mt-8">
        <button 
          onClick={(e) => { e.stopPropagation(); handlePrev(); }}
          className="bg-[#111] hover:bg-[#1a1a1a] border border-gray-800 text-white p-4 rounded-full transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); handleNext(); }}
          className="bg-[#111] hover:bg-[#1a1a1a] border border-gray-800 text-white p-4 rounded-full transition-colors"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
