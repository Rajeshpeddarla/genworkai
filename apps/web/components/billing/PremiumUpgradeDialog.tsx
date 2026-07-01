'use client';

import React from 'react';
import Link from 'next/link';
import { X, Sparkles, CreditCard, ArrowRight } from 'lucide-react';

interface PremiumUpgradeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export function PremiumUpgradeDialog({
  isOpen,
  onClose,
  title = 'AI Credits Exhausted',
  description = 'You have used all of your available AI credits. Upgrade to a Pro plan or purchase a credit pack to continue using advanced AI features.'
}: PremiumUpgradeDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200">
        <div className="relative p-6">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="w-12 h-12 bg-fuchsia-100 dark:bg-fuchsia-900/30 rounded-full flex items-center justify-center mb-4">
            <Sparkles className="w-6 h-6 text-fuchsia-600 dark:text-fuchsia-400" />
          </div>
          
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">{title}</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
            {description}
          </p>
          
          <div className="space-y-3">
            <Link 
              href="/billing"
              className="flex items-center justify-between w-full p-4 rounded-xl border-2 border-fuchsia-500/20 bg-fuchsia-50 dark:bg-fuchsia-500/10 hover:bg-fuchsia-100 dark:hover:bg-fuchsia-500/20 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="bg-fuchsia-500 text-white p-2 rounded-lg">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-zinc-900 dark:text-white">Get AI Credit Packs</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Pay as you go for high volume</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-fuchsia-500 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <button 
              onClick={onClose}
              className="w-full py-3 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
