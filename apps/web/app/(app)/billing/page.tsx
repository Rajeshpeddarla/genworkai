"use client";

import { useBillingStore } from "../../../store/billing";
import { Check, Star, Zap, Building, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { initializePaddle, Paddle } from "@paddle/paddle-js";
import Link from "next/link";

export default function BillingPage() {
  const { tier, downgrade } = useBillingStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paddle, setPaddle] = useState<Paddle>();
  const [plans, setPlans] = useState<any[]>([]);
  const [localizedPrices, setLocalizedPrices] = useState<Record<string, { formatted: string, raw: number }>>({});
  const [isLoadingPrices, setIsLoadingPrices] = useState(true);

  // Filter and sort plans dynamically
  const displayPlans = plans
    .filter(p => p.isActive !== false) // ensure we only show active plans
    .sort((a, b) => {
      if (a.slug === 'free') return -1;
      if (b.slug === 'free') return 1;
      if (a.slug === 'enterprise' || a.slug === 'custom') return 1;
      if (b.slug === 'enterprise' || b.slug === 'custom') return -1;
      return (a.monthlyPrice || 0) - (b.monthlyPrice || 0);
    });

  useEffect(() => {
    fetch('/api/profile')
      .then(res => res.json())
      .then(d => {
        if (d.plans) setPlans(d.plans);

        const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || '';
        const env = token.startsWith('live_') ? 'production' : 'sandbox';
        initializePaddle({ environment: env as any, token }).then(async p => {
          if (p) {
            setPaddle(p);
            
            // Fetch localized prices for internal billing page
            if (d.plans) {
              const priceIds = d.plans.flatMap((plan: any) => [plan.paddleMonthlyPriceId, plan.paddleYearlyPriceId].filter(id => id && typeof id === 'string' && id.startsWith('pri_01')));
              if (priceIds.length > 0) {
                try {
                  // Fetch the public IP to ensure Paddle returns accurate local currency (e.g., INR for India) even on localhost
                  let publicIp;
                  try { 
                    const ipRes = await fetch('https://api.ipify.org?format=json');
                    const ipData = await ipRes.json();
                    publicIp = ipData.ip;
                  } catch(e) {}
                  
                  const preview = await p.PricePreview({
                    items: priceIds.map((id: string) => ({ priceId: id, quantity: 1 })),
                    customerIpAddress: publicIp
                  });
                  
                  const newPrices: Record<string, { formatted: string, raw: number }> = {};
                  preview.data.details.lineItems.forEach((item: any) => {
                    newPrices[item.price.id] = {
                      formatted: item.formattedTotals.total,
                      raw: item.totals.total
                    };
                  });
                  setLocalizedPrices(newPrices);
                } catch (e) {
                  // Silently fail if Paddle API rejects local domain
                } finally {
                  setIsLoadingPrices(false);
                }
              } else {
                setIsLoadingPrices(false);
              }
            } else {
              setIsLoadingPrices(false);
            }
          }
        });
      })
      .catch(console.error);
  }, []);

  const handleUpgrade = (priceId: string) => {
    if (!paddle) {
      alert("Billing system is initializing, please wait a moment.");
      return;
    }
    if (!priceId) {
      alert("This plan price ID is not configured yet. Please configure it in the Admin Billing Studio.");
      return;
    }
    setIsProcessing(true);
    paddle.Checkout.open({
      items: [{ priceId, quantity: 1 }]
    });
    // Reset processing state after a slight delay
    setTimeout(() => setIsProcessing(false), 2000);
  };

  const handleDowngrade = () => {
    downgrade();
  };

  return (
    <div className="flex-1 overflow-y-auto bg-white dark:bg-card p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mb-3">Billing & Plans</h1>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto">Choose the perfect plan for your workspace. Upgrade to unlock powerful MCP integrations and the Automation Studio.</p>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
          {displayPlans.map(plan => {
            const isCurrentTier = tier === plan.slug;
            const isEnterprise = plan.slug === 'enterprise';
            const isCustom = isEnterprise; 
            
            // Generate icon and colors based on tier
            let Icon = Star;
            let iconColor = "text-zinc-600 dark:text-zinc-400";
            let iconBg = "bg-zinc-100 dark:bg-zinc-800";
            let borderColor = "border-zinc-200 dark:border-white/10";
            let bgColor = "bg-white dark:bg-card"; // Removed /50 which fails on hex variables
            let btnClasses = "";
            let checkColor = "text-zinc-500";
            
            if (isCurrentTier) {
              if (plan.slug === 'pro' || plan.slug === 'agency') {
                borderColor = "border-fuchsia-500";
                bgColor = "bg-fuchsia-50/50 dark:bg-fuchsia-950/20";
              } else if (plan.slug === 'free') {
                borderColor = "border-violet-500";
                bgColor = "bg-violet-50/50 dark:bg-violet-950/20";
              } else {
                borderColor = "border-emerald-500";
                bgColor = "bg-emerald-50/50 dark:bg-emerald-950/20";
              }
            }

            if (plan.slug === 'pro' || plan.slug === 'starter') {
              Icon = Zap;
              iconColor = "text-fuchsia-600 dark:text-fuchsia-400";
              iconBg = "bg-fuchsia-100 dark:bg-fuchsia-900/30";
              checkColor = "text-fuchsia-500";
              btnClasses = isCurrentTier 
                ? "bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 cursor-not-allowed" 
                : "bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-md";
            } else if (plan.slug === 'enterprise' || plan.slug === 'agency') {
              Icon = Building;
              iconColor = "text-emerald-600 dark:text-emerald-400";
              iconBg = "bg-emerald-100 dark:bg-emerald-900/30";
              checkColor = "text-emerald-500";
              btnClasses = isCurrentTier 
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 cursor-not-allowed" 
                : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md";
            } else if (plan.slug === 'team') {
              Icon = Users;
              iconColor = "text-blue-600 dark:text-blue-400";
              iconBg = "bg-blue-100 dark:bg-blue-900/30";
              checkColor = "text-blue-500";
              btnClasses = isCurrentTier 
                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 cursor-not-allowed" 
                : "bg-blue-600 hover:bg-blue-500 text-white shadow-md";
            } else {
              // Free or fallback
              checkColor = "text-violet-500";
              btnClasses = isCurrentTier
                ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700";
            }
            
            return (
              <div key={plan.id} className={`relative p-6 rounded-2xl border flex flex-col ${borderColor} ${bgColor} transition-all shadow-lg`}>
                {isCurrentTier && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider whitespace-nowrap">
                    Current Plan
                  </div>
                )}
                <div className="flex items-center gap-3 mb-4 mt-2">
                  <div className={`p-2 ${iconBg} rounded-lg`}>
                    <Icon className={`w-5 h-5 ${iconColor}`} />
                  </div>
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{plan.name}</h2>
                </div>
                
                <div className="mb-6 flex-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-zinc-900 dark:text-white">
                      {(() => {
                        if (isCustom) return "Custom";
                        if (plan.slug === 'free') {
                          if (isLoadingPrices) return '...';
                          const firstPrice = Object.values(localizedPrices)[0];
                          return firstPrice ? firstPrice.formatted.replace(/[\d.,]+/g, '0').replace(/0+/g, '0') : "$0";
                        }
                        if (isLoadingPrices) return '...';
                        return localizedPrices[plan.paddleMonthlyPriceId]?.formatted || `$${plan.monthlyPrice / 100}`;
                      })()}
                    </span>
                    {!isCustom && <span className="text-zinc-500 dark:text-zinc-400">/month</span>}
                  </div>
                  <p className="text-sm text-zinc-500 mt-2">{plan.description}</p>
                </div>
                
                <ul className="space-y-4 mb-8 text-sm">
                  <li className="flex items-start gap-3 text-zinc-600 dark:text-zinc-300">
                    <Check className={`w-4 h-4 shrink-0 mt-0.5 ${checkColor}`} />
                    <span>{plan.knowledgeBaseLimit === -1 ? 'Unlimited Knowledge Bases' : `${plan.knowledgeBaseLimit} Knowledge Base${plan.knowledgeBaseLimit === 1 ? '' : 's'}`}</span>
                  </li>
                  <li className="flex items-start gap-3 text-zinc-600 dark:text-zinc-300">
                    <Check className={`w-4 h-4 shrink-0 mt-0.5 ${checkColor}`} />
                    <span>{plan.databaseLimit === -1 ? 'Unlimited Databases' : `${plan.databaseLimit} Database Connection${plan.databaseLimit === 1 ? '' : 's'}`}</span>
                  </li>
                  <li className="flex items-start gap-3 text-zinc-600 dark:text-zinc-300">
                    <Check className={`w-4 h-4 shrink-0 mt-0.5 ${checkColor}`} />
                    <span>{plan.mcpServerLimit === -1 ? 'Unlimited MCP Endpoints' : `${plan.mcpServerLimit} MCP Endpoint${plan.mcpServerLimit === 1 ? '' : 's'}`}</span>
                  </li>
                  <li className="flex items-start gap-3 text-zinc-600 dark:text-zinc-300">
                    <Check className={`w-4 h-4 shrink-0 mt-0.5 ${checkColor}`} />
                    <span>{plan.automationLimit === -1 ? 'Unlimited Automations' : `${plan.automationLimit} Automation${plan.automationLimit === 1 ? '' : 's'}`}</span>
                  </li>
                  <li className="flex items-start gap-3 text-zinc-600 dark:text-zinc-300">
                    <Check className={`w-4 h-4 shrink-0 mt-0.5 ${checkColor}`} />
                    <span>{plan.monthlyAiCredits === -1 ? 'Unlimited AI Credits' : `${plan.monthlyAiCredits.toLocaleString()} Monthly AI Credits`}</span>
                  </li>
                  {plan.byokEnabled && (
                    <li className="flex items-start gap-3 text-zinc-600 dark:text-zinc-300">
                      <Check className={`w-4 h-4 shrink-0 mt-0.5 ${checkColor}`} />
                      <span>Bring Your Own Key (BYOK)</span>
                    </li>
                  )}
                  {plan.apiAccessEnabled && (
                    <li className="flex items-start gap-3 text-zinc-600 dark:text-zinc-300">
                      <Check className={`w-4 h-4 shrink-0 mt-0.5 ${checkColor}`} />
                      <span>Public API Access</span>
                    </li>
                  )}
                </ul>

                {isCustom ? (
                  <Link href="/contact" className="w-full py-2.5 rounded-lg font-medium transition-colors text-sm border border-zinc-200 dark:border-white/10 bg-transparent hover:bg-zinc-50 dark:hover:bg-white/5 text-zinc-900 dark:text-white flex justify-center items-center">
                    Contact Sales
                  </Link>
                ) : plan.slug === 'free' ? (
                  <button 
                    onClick={handleDowngrade}
                    disabled={isCurrentTier}
                    className={`w-full py-2.5 rounded-lg font-medium transition-colors text-sm ${btnClasses}`}
                  >
                    {isCurrentTier ? 'Current Plan' : 'Downgrade to Free'}
                  </button>
                ) : (
                  <button 
                    onClick={() => handleUpgrade(plan.paddleMonthlyPriceId)}
                    disabled={isCurrentTier || isProcessing}
                    className={`w-full py-2.5 rounded-lg font-medium transition-colors flex justify-center items-center gap-2 text-sm ${btnClasses}`}
                  >
                    {isProcessing ? 'Processing...' : isCurrentTier ? 'Active' : `Upgrade to ${plan.name}`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}