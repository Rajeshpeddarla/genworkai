"use client";

import { useBillingStore } from "../../../store/billing";
import { Check, CreditCard, Star, Zap, Users, Building } from "lucide-react";
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
      <div className="max-w-6xl mx-auto">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mb-3">Billing & Plans</h1>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto">Choose the perfect plan for your workspace. Upgrade to unlock powerful MCP integrations and the Automation Studio.</p>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
          
          {/* Free Tier */}
          <div className={`p-6 rounded-2xl border flex flex-col ${tier === 'free' ? 'border-violet-500 bg-violet-50/50 dark:bg-violet-950/20' : 'border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900/50'} transition-all`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                <Star className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
              </div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Free</h2>
            </div>
            <div className="mb-6 flex-1">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-zinc-900 dark:text-white">$0</span>
                <span className="text-zinc-500 dark:text-zinc-400">/month</span>
              </div>
              <p className="text-sm text-zinc-500 mt-2">For individuals exploring the platform.</p>
            </div>
            <ul className="space-y-4 mb-8 text-sm">
              <li className="flex items-start gap-3 text-zinc-600 dark:text-zinc-300">
                <Check className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
                <span>1 Knowledge Base</span>
              </li>
              <li className="flex items-start gap-3 text-zinc-600 dark:text-zinc-300">
                <Check className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
                <span>100 Documents Limit</span>
              </li>
              <li className="flex items-start gap-3 text-zinc-600 dark:text-zinc-300">
                <Check className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
                <span>1 MCP Endpoint</span>
              </li>
              <li className="flex items-start gap-3 text-zinc-600 dark:text-zinc-300">
                <Check className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
                <span>Community Support</span>
              </li>
            </ul>
            <button 
              onClick={handleDowngrade}
              disabled={tier === 'free'}
              className={`w-full py-2.5 rounded-lg font-medium transition-colors text-sm ${tier === 'free' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
            >
              {tier === 'free' ? 'Current Plan' : 'Downgrade to Free'}
            </button>
          </div>

          {/* Pro Tier */}
          <div className={`relative p-6 rounded-2xl border flex flex-col ${tier === 'pro' ? 'border-fuchsia-500 bg-fuchsia-50/50 dark:bg-fuchsia-950/20' : 'border-violet-200 dark:border-violet-900/50 bg-white dark:bg-zinc-900/50'} transition-all shadow-lg`}>
            {tier === 'pro' && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider whitespace-nowrap">
                Current Plan
              </div>
            )}
            <div className="flex items-center gap-3 mb-4 mt-2">
              <div className="p-2 bg-fuchsia-100 dark:bg-fuchsia-900/30 rounded-lg">
                <Zap className="w-5 h-5 text-fuchsia-600 dark:text-fuchsia-400" />
              </div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Pro</h2>
            </div>
            <div className="mb-6 flex-1">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-zinc-900 dark:text-white">$19</span>
                <span className="text-zinc-500 dark:text-zinc-400">/month</span>
              </div>
              <p className="text-xs text-violet-600 dark:text-violet-400 mt-1 font-medium">Regional Pricing Available (e.g. ₹599 in IN)</p>
              <p className="text-sm text-zinc-500 mt-2">For independent researchers and developers.</p>
            </div>
            <ul className="space-y-4 mb-8 text-sm">
              <li className="flex items-start gap-3 text-zinc-600 dark:text-zinc-300">
                <Check className="w-4 h-4 text-fuchsia-500 shrink-0 mt-0.5" />
                <span className="font-medium text-zinc-900 dark:text-white">10 Knowledge Bases</span>
              </li>
              <li className="flex items-start gap-3 text-zinc-600 dark:text-zinc-300">
                <Check className="w-4 h-4 text-fuchsia-500 shrink-0 mt-0.5" />
                <span>Unlimited Documents</span>
              </li>
              <li className="flex items-start gap-3 text-zinc-600 dark:text-zinc-300">
                <Check className="w-4 h-4 text-fuchsia-500 shrink-0 mt-0.5" />
                <span className="font-medium text-zinc-900 dark:text-white">5 MCP Endpoints</span>
              </li>
              <li className="flex items-start gap-3 text-zinc-600 dark:text-zinc-300">
                <Check className="w-4 h-4 text-fuchsia-500 shrink-0 mt-0.5" />
                <span>Automation Studio Access</span>
              </li>
            </ul>
            <button 
              onClick={handleUpgrade}
              disabled={tier === 'pro' || isProcessing}
              className={`w-full py-2.5 rounded-lg font-medium transition-colors flex justify-center items-center gap-2 text-sm ${tier === 'pro' ? 'bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 cursor-not-allowed' : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-md'}`}
            >
              {isProcessing ? 'Processing...' : tier === 'pro' ? 'Active' : 'Upgrade to Pro'}
            </button>
          </div>

          {/* Team Tier */}
          <div className={`p-6 rounded-2xl border flex flex-col border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900/50 transition-all`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Team</h2>
            </div>
            <div className="mb-6 flex-1">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-zinc-900 dark:text-white">$39</span>
                <span className="text-zinc-500 dark:text-zinc-400">/seat</span>
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">Regional Pricing Available (e.g. ₹1.5k in IN)</p>
              <p className="text-sm text-zinc-500 mt-2">For growing teams requiring collaboration.</p>
            </div>
            <ul className="space-y-4 mb-8 text-sm">
              <li className="flex items-start gap-3 text-zinc-600 dark:text-zinc-300">
                <Check className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <span>Everything in Pro</span>
              </li>
              <li className="flex items-start gap-3 text-zinc-600 dark:text-zinc-300">
                <Check className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <span className="font-medium text-zinc-900 dark:text-white">Shared Knowledge Bases</span>
              </li>
              <li className="flex items-start gap-3 text-zinc-600 dark:text-zinc-300">
                <Check className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <span>RBAC (Role-Based Access)</span>
              </li>
              <li className="flex items-start gap-3 text-zinc-600 dark:text-zinc-300">
                <Check className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <span>Audit Logs</span>
              </li>
            </ul>
            <button className="w-full py-2.5 rounded-lg font-medium transition-colors text-sm bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900">
              Upgrade to Team
            </button>
          </div>

          {/* Business Tier */}
          <div className={`p-6 rounded-2xl border flex flex-col border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900/50 transition-all`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <Building className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Business</h2>
            </div>
            <div className="mb-6 flex-1">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-zinc-900 dark:text-white">Custom</span>
              </div>
              <p className="text-sm text-zinc-500 mt-2">For large enterprises with specific security needs.</p>
            </div>
            <ul className="space-y-4 mb-8 text-sm">
              <li className="flex items-start gap-3 text-zinc-600 dark:text-zinc-300">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Everything in Team</span>
              </li>
              <li className="flex items-start gap-3 text-zinc-600 dark:text-zinc-300">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>SSO / SAML Authentication</span>
              </li>
              <li className="flex items-start gap-3 text-zinc-600 dark:text-zinc-300">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>On-Premise Deployment</span>
              </li>
              <li className="flex items-start gap-3 text-zinc-600 dark:text-zinc-300">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Dedicated Support & SLAs</span>
              </li>
            </ul>
            <button className="w-full py-2.5 rounded-lg font-medium transition-colors text-sm border border-zinc-200 dark:border-white/10 bg-transparent hover:bg-zinc-50 dark:hover:bg-white/5 text-zinc-900 dark:text-white">
              Contact Sales
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}