"use client";

import { useBillingStore } from "../../../store/billing";
import { Check, CreditCard, Star, Zap } from "lucide-react";
import { useState } from "react";

export default function BillingPage() {
  const { tier, upgrade, downgrade } = useBillingStore();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUpgrade = () => {
    setIsProcessing(true);
    setTimeout(() => {
      upgrade();
      setIsProcessing(false);
    }, 1500); // Mock network request
  };

  const handleDowngrade = () => {
    downgrade();
  };

  return (
    <div className="flex-1 overflow-y-auto bg-white dark:bg-zinc-950 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mb-2">Billing Studio</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Manage your subscription, compute limits, and billing history.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Free Tier */}
          <div className={`p-8 rounded-2xl border ${tier === 'free' ? 'border-violet-500 bg-violet-50/50 dark:bg-violet-950/20' : 'border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900/50'} transition-all`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                <Star className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
              </div>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Hobby Plan</h2>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold text-zinc-900 dark:text-white">$0</span>
              <span className="text-zinc-500 dark:text-zinc-400">/month</span>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-3 text-zinc-600 dark:text-zinc-300">
                <Check className="w-5 h-5 text-violet-500 shrink-0" />
                <span>1 Knowledge Base</span>
              </li>
              <li className="flex items-center gap-3 text-zinc-600 dark:text-zinc-300">
                <Check className="w-5 h-5 text-violet-500 shrink-0" />
                <span>Basic Workspace Generators</span>
              </li>
              <li className="flex items-center gap-3 text-zinc-600 dark:text-zinc-300">
                <Check className="w-5 h-5 text-violet-500 shrink-0" />
                <span>0 MCP Servers</span>
              </li>
              <li className="flex items-center gap-3 text-zinc-600 dark:text-zinc-300">
                <Check className="w-5 h-5 text-violet-500 shrink-0" />
                <span>Shared Compute</span>
              </li>
            </ul>
            <button 
              onClick={handleDowngrade}
              disabled={tier === 'free'}
              className={`w-full py-2.5 rounded-lg font-medium transition-colors ${tier === 'free' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
            >
              {tier === 'free' ? 'Current Plan' : 'Downgrade'}
            </button>
          </div>

          {/* Pro Tier */}
          <div className={`relative p-8 rounded-2xl border ${tier === 'pro' ? 'border-fuchsia-500 bg-fuchsia-50/50 dark:bg-fuchsia-950/20' : 'border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900/50'} transition-all shadow-xl`}>
            {tier === 'pro' && (
              <div className="absolute -top-3 right-8 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                ACTIVE
              </div>
            )}
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-fuchsia-100 dark:bg-fuchsia-900/30 rounded-lg">
                <Zap className="w-5 h-5 text-fuchsia-600 dark:text-fuchsia-400" />
              </div>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Enterprise Pro</h2>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold text-zinc-900 dark:text-white">$99</span>
              <span className="text-zinc-500 dark:text-zinc-400">/month</span>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-3 text-zinc-600 dark:text-zinc-300">
                <Check className="w-5 h-5 text-fuchsia-500 shrink-0" />
                <span>Unlimited Knowledge Bases</span>
              </li>
              <li className="flex items-center gap-3 text-zinc-600 dark:text-zinc-300">
                <Check className="w-5 h-5 text-fuchsia-500 shrink-0" />
                <span>Advanced Canvas & Exporters</span>
              </li>
              <li className="flex items-center gap-3 text-zinc-600 dark:text-zinc-300">
                <Check className="w-5 h-5 text-fuchsia-500 shrink-0" />
                <span>Up to 20 MCP Servers</span>
              </li>
              <li className="flex items-center gap-3 text-zinc-600 dark:text-zinc-300">
                <Check className="w-5 h-5 text-fuchsia-500 shrink-0" />
                <span>Dedicated GPU Compute</span>
              </li>
            </ul>
            <button 
              onClick={handleUpgrade}
              disabled={tier === 'pro' || isProcessing}
              className={`w-full py-2.5 rounded-lg font-medium transition-colors flex justify-center items-center gap-2 ${tier === 'pro' ? 'bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 cursor-not-allowed' : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-md'}`}
            >
              {isProcessing ? (
                <span className="animate-pulse">Processing...</span>
              ) : tier === 'pro' ? (
                'Current Plan'
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Upgrade to Pro
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}