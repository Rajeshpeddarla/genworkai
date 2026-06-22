"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, Zap, Shield, Blocks, Server, Database, BrainCircuit, Activity, Clock } from "lucide-react";
import { initializePaddle, Paddle } from "@paddle/paddle-js";

export default function PricingClient({ plans, activePromo }: { plans: any[], activePromo: any }) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [timeLeft, setTimeLeft] = useState<{ d: number, h: number, m: number, s: number } | null>(null);
  const [paddle, setPaddle] = useState<Paddle>();
  const [localizedPrices, setLocalizedPrices] = useState<Record<string, { formatted: string, raw: number }>>({});

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || '';
    const env = token.startsWith('live_') ? 'production' : 'sandbox';
    
    initializePaddle({
      environment: env,
      token: token,
    }).then(async (paddleInstance: Paddle | undefined) => {
      if (paddleInstance) {
        setPaddle(paddleInstance);
        
        // Phase 6: Dynamic Pricing System - fetch localized prices
        const priceIds = plans
          .filter(p => p.slug !== 'enterprise')
          .flatMap(p => [p.paddleMonthlyPriceId, p.paddleYearlyPriceId].filter(Boolean));
        
        if (priceIds.length > 0) {
          try {
            const preview = await paddleInstance.PricePreview({
              items: priceIds.map(id => ({ priceId: id, quantity: 1 }))
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
            console.error("Failed to fetch price previews", e);
          }
        }

        // Handle auto-checkout from internal app links
        const params = new URLSearchParams(window.location.search);
        const checkoutSlug = params.get('checkout');
        if (checkoutSlug) {
          const plan = plans.find(p => p.slug === checkoutSlug);
          if (plan && plan.paddleMonthlyPriceId) {
            setTimeout(() => {
              paddleInstance.Checkout.open({
                items: [{ priceId: plan.paddleMonthlyPriceId, quantity: 1 }],
              });
            }, 500); // Small delay to ensure UI renders
          }
        }
      }
    });
  }, [plans]);

  const handleCheckout = (priceId: string | null) => {
    console.log("handleCheckout triggered with priceId:", priceId);
    console.log("Paddle initialized:", !!paddle);

    if (!priceId) {
      alert("Billing is not fully configured yet. Missing Price ID. Please try again later.");
      return;
    }
    if (paddle) {
      paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
      });
    } else {
      alert("Billing gateway (Paddle) is still initializing or failed to load. Please refresh the page.");
    }
  };

  useEffect(() => {
    if (!activePromo?.expiresAt) return;
    const expiry = new Date(activePromo.expiresAt).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = expiry - now;

      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft(null);
        return;
      }

      setTimeLeft({
        d: Math.floor(distance / (1000 * 60 * 60 * 24)),
        h: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        m: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        s: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activePromo]);

  const formatPrice = (cents: number, cycle: "monthly" | "yearly") => {
    let price = cents / 100;
    if (activePromo?.value?.discountPercent) {
      price = price * (1 - activePromo.value.discountPercent / 100);
    }
    const finalPrice = cycle === "yearly" ? Math.floor(price / 12) : price;
    return parseFloat(finalPrice.toFixed(2));
  };

  const getOriginalPrice = (cents: number, cycle: "monthly" | "yearly") => {
    const price = cents / 100;
    const finalPrice = cycle === "yearly" ? Math.floor(price / 12) : price;
    return parseFloat(finalPrice.toFixed(2));
  };

  return (
    <div className="min-h-screen bg-[#020202] text-white font-sans selection:bg-violet-500/30 overflow-x-hidden">
      
      {/* Navbar */}
      <nav className="fixed top-0 z-50 w-full bg-[#020202]/80 backdrop-blur-xl border-b border-white/5 shadow-sm">
        <div className="flex items-center justify-between p-4 max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="GenWorkAI" className="w-8 h-8 rounded-lg shadow-lg shadow-violet-500/20 object-cover" />
            <span className="text-xl font-bold tracking-tight text-white drop-shadow-md">GenWork<span className="text-violet-500">AI</span></span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <Link href="/#features" className="hover:text-white transition-colors">Features</Link>
            <Link href="/#workflow" className="hover:text-white transition-colors">Workflow</Link>
            <Link href="/pricing" className="text-white font-bold transition-colors">Pricing</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="px-5 py-2 text-sm font-bold bg-white text-black rounded-full hover:bg-zinc-200 transition-colors">Sign In</Link>
          </div>
        </div>
      </nav>

      <div className="pt-32 pb-24 px-6 max-w-[1400px] mx-auto">
        <div className="text-center mb-16 relative">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-violet-600/10 blur-[120px] rounded-full pointer-events-none" />
          
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight tracking-tighter relative z-10">
            Simple Pricing.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400">
              Enterprise Scale.
            </span>
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-8 relative z-10">
            Start building intelligent applications immediately. No hidden fees.
          </p>

          {activePromo && timeLeft && (
            <div className="inline-flex flex-col sm:flex-row items-center gap-4 px-6 py-3 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400 mb-8 relative z-10 shadow-[0_0_30px_rgba(217,70,239,0.15)] animate-pulse-slow">
              <span className="font-bold text-lg">{activePromo.description}</span>
              <div className="hidden sm:block w-px h-6 bg-fuchsia-500/30"></div>
              <div className="flex items-center gap-2 font-mono text-xl font-bold">
                <Clock className="w-5 h-5 mb-0.5" />
                <span>{timeLeft.d}d</span> : <span>{timeLeft.h.toString().padStart(2, '0')}h</span> : <span>{timeLeft.m.toString().padStart(2, '0')}m</span> : <span>{timeLeft.s.toString().padStart(2, '0')}s</span>
              </div>
            </div>
          )}

          <div className="flex justify-center items-center gap-4 mb-16 relative z-10">
            <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-white' : 'text-zinc-500'}`}>Monthly</span>
            <button 
              onClick={() => setBillingCycle(c => c === 'monthly' ? 'yearly' : 'monthly')}
              className="w-14 h-8 rounded-full bg-white/10 p-1 flex items-center transition-colors hover:bg-white/20"
            >
              <div className={`w-6 h-6 rounded-full bg-violet-500 transition-transform ${billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
            <span className={`text-sm font-medium flex items-center gap-2 ${billingCycle === 'yearly' ? 'text-white' : 'text-zinc-500'}`}>
              Yearly <span className="px-2 py-0.5 rounded text-xs bg-emerald-500/20 text-emerald-400">Save 20%</span>
            </span>
          </div>
        </div>

        {/* PRICING CARDS */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 xl:gap-4 mb-32 relative z-10">
          {plans.map(plan => {
            const isEnterprise = plan.slug === 'enterprise';
            const price = isEnterprise ? "Custom" : formatPrice(billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice, billingCycle);
            const originalPrice = isEnterprise ? "Custom" : getOriginalPrice(billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice, billingCycle);
            const isDiscounted = !isEnterprise && activePromo && price !== originalPrice;
            const isPro = plan.slug === 'pro';

            return (
              <div key={plan.id} className={`flex flex-col bg-[#0a0a0a] rounded-3xl border ${isPro ? 'border-violet-500 shadow-[0_0_40px_rgba(139,92,246,0.15)] relative xl:scale-105 z-20' : 'border-zinc-800 hover:border-zinc-700'} p-6 transition-all duration-300`}>
                {isPro && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-violet-500 text-white text-xs font-bold rounded-full uppercase tracking-wider">
                    Most Popular
                  </div>
                )}
                
                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-xs text-zinc-400 mb-6 min-h-[40px] leading-relaxed">{plan.description}</p>
                
                <div className="mb-8">
                  {isEnterprise ? (
                    <span className="text-3xl font-bold text-white">Contact Us</span>
                  ) : (
                    <div className="flex items-end gap-1">
                      <span className="text-4xl font-bold text-white tracking-tight">
                        {(() => {
                          const activePriceId = billingCycle === 'yearly' ? plan.paddleYearlyPriceId : plan.paddleMonthlyPriceId;
                          const localized = activePriceId ? localizedPrices[activePriceId] : undefined;
                          return localized ? localized.formatted : `$${price}`;
                        })()}
                      </span>
                      <span className="text-sm text-zinc-500 mb-1 font-medium">/mo</span>
                    </div>
                  )}
                  {isDiscounted && !isEnterprise && (
                    <div className="text-sm font-medium text-zinc-500 line-through mt-2">${originalPrice}/mo originally</div>
                  )}
                  {billingCycle === 'yearly' && !isEnterprise && <div className="text-xs font-bold text-emerald-400 mt-2">Billed annually</div>}
                </div>

                {isEnterprise ? (
                  <Link 
                    href="/contact" 
                    className={`w-full block py-3 rounded-xl text-center font-bold mb-8 transition-colors bg-white text-black hover:bg-zinc-200`}
                  >
                    Contact Sales
                  </Link>
                ) : (
                  <button 
                    onClick={() => handleCheckout(billingCycle === 'yearly' ? plan.paddleYearlyPriceId : plan.paddleMonthlyPriceId)}
                    className={`w-full py-3 rounded-xl text-center font-bold mb-8 transition-colors ${
                      isPro 
                      ? 'bg-violet-600 hover:bg-violet-500 text-white' 
                      : 'bg-white/10 hover:bg-white/20 text-white'
                    }`}
                  >
                    Get Started
                  </button>
                )}

                <div className="flex-1">
                  {isEnterprise ? (
                    <div className="space-y-4">
                      <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Enterprise Features</p>
                      <ul className="space-y-3 text-sm text-zinc-300">
                        <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Custom Deployment</li>
                        <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> 99.99% SLA</li>
                        <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Dedicated Support</li>
                        <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Custom MCP Infrastructure</li>
                        <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Bring Your Own Key (BYOK)</li>
                      </ul>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div>
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Capabilities</p>
                        <ul className="space-y-3 text-sm text-zinc-300">
                          <li className="flex items-center gap-3">{plan.knowledgeBaseEnabled ? <CheckCircle2 className="w-4 h-4 text-violet-400" /> : <XCircle className="w-4 h-4 text-zinc-700" />} Knowledge Base</li>
                          <li className="flex items-center gap-3">{plan.databaseIntelligenceEnabled ? <CheckCircle2 className="w-4 h-4 text-violet-400" /> : <XCircle className="w-4 h-4 text-zinc-700" />} Database Intelligence</li>
                          <li className="flex items-center gap-3">{plan.automationStudioEnabled ? <CheckCircle2 className="w-4 h-4 text-violet-400" /> : <XCircle className="w-4 h-4 text-zinc-700" />} Automation Studio</li>
                          <li className="flex items-center gap-3">{plan.mcpEnabled ? <CheckCircle2 className="w-4 h-4 text-violet-400" /> : <XCircle className="w-4 h-4 text-zinc-700" />} MCP Builder</li>
                          <li className="flex items-center gap-3">{plan.apiAccessEnabled ? <CheckCircle2 className="w-4 h-4 text-violet-400" /> : <XCircle className="w-4 h-4 text-zinc-700" />} Public APIs</li>
                          <li className="flex items-center gap-3">{plan.byokEnabled ? <CheckCircle2 className="w-4 h-4 text-violet-400" /> : <XCircle className="w-4 h-4 text-zinc-700" />} BYOK</li>
                        </ul>
                      </div>
                      
                      <div className="pt-4 border-t border-zinc-800">
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Monthly Limits</p>
                        <ul className="space-y-3 text-sm text-zinc-400">
                          <li className="flex justify-between items-center">
                            <span>API Requests</span>
                            <span className="font-mono text-white">{plan.apiRequestLimit.toLocaleString()}</span>
                          </li>
                          <li className="flex justify-between items-center">
                            <span>MCP Servers</span>
                            <span className="font-mono text-white">{plan.mcpServerLimit}</span>
                          </li>
                          <li className="flex justify-between items-center">
                            <span>MCP Tools</span>
                            <span className="font-mono text-white">{plan.mcpToolLimit}</span>
                          </li>
                          <li className="flex justify-between items-center">
                            <span>Context limit</span>
                            <span className="font-mono text-white">{plan.contextLimit / 1000000}MB</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Feature Comparison */}
        <div className="mb-32">
          <h2 className="text-3xl font-bold text-center mb-12">Feature Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead className="border-b border-zinc-800 text-sm">
                <tr>
                  <th className="py-4 px-6 font-medium text-zinc-400 w-1/4">Feature</th>
                  {plans.map(p => <th key={p.id} className="py-4 px-6 font-bold text-white text-center w-[15%]">{p.name}</th>)}
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-zinc-800/50">
                <tr className="bg-white/5"><td colSpan={6} className="py-2 px-6 font-bold text-violet-400">Core Intelligence</td></tr>
                <tr>
                  <td className="py-4 px-6 text-zinc-300">Knowledge Bases</td>
                  {plans.map(p => <td key={p.id} className="py-4 px-6 text-center text-zinc-500">{p.knowledgeBaseLimit > 0 ? p.knowledgeBaseLimit : 'Unlimited'}</td>)}
                </tr>
                <tr>
                  <td className="py-4 px-6 text-zinc-300">Database Intelligence</td>
                  {plans.map(p => <td key={p.id} className="py-4 px-6 text-center text-zinc-500">{p.databaseIntelligenceEnabled ? <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" /> : '-'}</td>)}
                </tr>
                
                <tr className="bg-white/5"><td colSpan={6} className="py-2 px-6 font-bold text-violet-400">Developer Platform</td></tr>
                <tr>
                  <td className="py-4 px-6 text-zinc-300">Public API Access</td>
                  {plans.map(p => <td key={p.id} className="py-4 px-6 text-center text-zinc-500">{p.apiAccessEnabled ? <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" /> : '-'}</td>)}
                </tr>
                <tr>
                  <td className="py-4 px-6 text-zinc-300">Model Context Protocol (MCP)</td>
                  {plans.map(p => <td key={p.id} className="py-4 px-6 text-center text-zinc-500">{p.mcpEnabled ? <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" /> : '-'}</td>)}
                </tr>
                <tr>
                  <td className="py-4 px-6 text-zinc-300">Bring Your Own Key (BYOK)</td>
                  {plans.map(p => <td key={p.id} className="py-4 px-6 text-center text-zinc-500">{p.byokEnabled ? <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" /> : '-'}</td>)}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Intelligence APIs Section */}
        <div className="bg-gradient-to-br from-zinc-900 to-[#050505] rounded-3xl border border-zinc-800 p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 blur-[100px] pointer-events-none rounded-full" />
          
          <h2 className="text-3xl font-bold text-white mb-4 relative z-10">Intelligence APIs</h2>
          <p className="text-zinc-400 max-w-2xl mb-12 relative z-10">Access your platform's intelligence through a standard, unified REST API or MCP infrastructure.</p>

          <div className="grid md:grid-cols-3 gap-8 relative z-10">
            <div className="bg-black/50 p-6 rounded-2xl border border-white/5 backdrop-blur-sm">
              <BrainCircuit className="w-8 h-8 text-violet-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Knowledge API</h3>
              <p className="text-sm text-zinc-400 mb-4">Query your repositories and documents contextually with advanced semantic search and generation endpoints.</p>
              <div className="bg-[#111] p-3 rounded-lg border border-zinc-800 text-xs font-mono text-zinc-300">
                GET /api/v1/kb/&#123;id&#125;/search
              </div>
            </div>

            <div className="bg-black/50 p-6 rounded-2xl border border-white/5 backdrop-blur-sm">
              <Database className="w-8 h-8 text-emerald-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">DB Intelligence API</h3>
              <p className="text-sm text-zinc-400 mb-4">Automatically generate SQL, execute complex queries via natural language, and retrieve schema documentation.</p>
              <div className="bg-[#111] p-3 rounded-lg border border-zinc-800 text-xs font-mono text-zinc-300">
                POST /api/v1/db/&#123;id&#125;/ask
              </div>
            </div>

            <div className="bg-black/50 p-6 rounded-2xl border border-white/5 backdrop-blur-sm">
              <Blocks className="w-8 h-8 text-cyan-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">MCP Interface</h3>
              <p className="text-sm text-zinc-400 mb-4">Standardized endpoints exposing knowledge bases and databases as tools for Claude, Cursor, and custom agents.</p>
              <div className="bg-[#111] p-3 rounded-lg border border-zinc-800 text-xs font-mono text-zinc-300">
                GET /api/mcp/sse
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
