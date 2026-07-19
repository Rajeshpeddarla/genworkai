"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function UpgradePlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [currentPlanId, setCurrentPlanId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/pricing")
      .then(res => res.json())
      .then(data => {
        if (data.plans) setPlans(data.plans);
        if (data.currentPlanId) setCurrentPlanId(data.currentPlanId);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleUpgrade = (planId: number) => {
    // In a real implementation, this would trigger Paddle checkout
    alert("Checkout integration pending for Plan ID: " + planId);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h1 className="font-pixel text-3xl uppercase tracking-wider mb-4">Node Capacity Upgrade</h1>
        <p className="font-mono text-zinc-400 text-sm">
          Scale your extraction limits seamlessly. Choose the bandwidth that fits your processing requirements.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={plan.id}
              className={`border p-6 flex flex-col relative overflow-hidden ${
                plan.priceCents > 0 && plan.priceCents < 5000 
                  ? "border-cyan-500/50 bg-zinc-50 dark:bg-[#050505]" 
                  : "border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20 bg-white dark:bg-black"
              }`}
            >
              {plan.priceCents > 0 && plan.priceCents < 5000 && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-3xl pointer-events-none" />
              )}
              
              <div className="mb-6 relative z-10">
                <h3 className="font-pixel text-xl uppercase text-black dark:text-white mb-2">{plan.name}</h3>
                <div className="flex items-end gap-1 mb-4">
                  <span className="font-mono text-2xl text-cyan-400">${(plan.priceCents / 100).toFixed(0)}</span>
                  {plan.priceCents > 0 && <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest mb-1">/mo</span>}
                </div>
                <p className="font-mono text-xs text-zinc-400">
                  {plan.pageExtractionLimit.toLocaleString()} pages/month
                </p>
              </div>

              <div className="flex-1 space-y-3 mb-8 relative z-10">
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                  <span className="font-mono text-[10px] sm:text-xs text-zinc-700 dark:text-zinc-300">Fast Extraction API</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                  <span className="font-mono text-[10px] sm:text-xs text-zinc-700 dark:text-zinc-300">Structured JSON Output</span>
                </div>
                {plan.priceCents > 0 && (
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                    <span className="font-mono text-[10px] sm:text-xs text-zinc-700 dark:text-zinc-300">Priority Processing</span>
                  </div>
                )}
                {plan.priceCents >= 2500 && (
                  <>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                      <span className="font-mono text-[10px] sm:text-xs text-zinc-700 dark:text-zinc-300">Semantic Chunks API</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                      <span className="font-mono text-[10px] sm:text-xs text-zinc-700 dark:text-zinc-300">Embeddings API (Vector)</span>
                    </div>
                  </>
                )}
                {plan.priceCents >= 10000 && (
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                    <span className="font-mono text-[10px] sm:text-xs text-zinc-700 dark:text-zinc-300">Search API (RAG built-in)</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => handleUpgrade(plan.id)}
                className={`w-full py-3 font-bold flex items-center justify-center gap-2 transition-colors uppercase tracking-widest text-xs relative z-10 ${
                  plan.id === currentPlanId
                    ? "bg-black dark:bg-white text-white dark:text-black cursor-default"
                    : plan.priceCents > 0 && plan.priceCents < 5000
                      ? "bg-[#014b5c] dark:bg-cyan-500 hover:bg-[#013b4c] dark:hover:bg-cyan-400 text-white dark:text-black"
                      : "bg-black dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-black"
                }`}
                disabled={plan.id === currentPlanId}
              >
                {plan.id === currentPlanId ? "Current Node" : "Deploy Upgrade"} 
                {plan.id !== currentPlanId && <ArrowRight className="w-4 h-4" />}
              </button>
            </motion.div>
          ))}
        </div>
      )}

    </div>
  );
}
