"use client";

import { useMockData } from "../MockProvider";
import { Check, Sparkles, Building, Zap } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function PricingPage() {
  const { currentPlan, setCurrentPlan, availablePlans } = useMockData();

  return (
    <div className="min-h-screen bg-[#030303] text-white overflow-hidden relative">
      
      {/* Navbar Minimal */}
      <nav className="absolute top-0 z-50 w-full p-6">
        <Link href="/" className="flex items-center gap-3">
          <img src="/logo.png" className="w-8 h-8 object-contain" alt="BaseParse" />
          <span className="font-bold text-xl">BaseParse</span>
        </Link>
      </nav>

      {/* Background Gradients */}
      <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-cyan-900/20 to-transparent pointer-events-none -z-10" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-violet-600/20 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto pt-32 pb-24 px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h1 className="text-5xl font-black mb-6 tracking-tight">Simple, Transparent Pricing</h1>
          <p className="text-xl text-zinc-400">
            Stop paying per character for OCR. We charge a flat rate per document parsed, and diagram extraction is always unlimited.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 items-center">
          {availablePlans.map((plan, i) => {
            const isPro = plan.id === "pro";
            const isActive = currentPlan === plan.id;
            
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`relative p-8 rounded-3xl border ${
                  isPro 
                    ? "bg-gradient-to-b from-cyan-950/40 to-[#0a0a0a] border-cyan-500/50 shadow-[0_0_40px_rgba(34,211,238,0.15)] md:scale-105" 
                    : "bg-[#0a0a0a] border-white/10"
                }`}
              >
                {isPro && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-cyan-500 text-black px-4 py-1 rounded-full text-sm font-bold flex items-center gap-1 shadow-lg">
                    <Sparkles className="w-4 h-4" /> Most Popular
                  </div>
                )}
                
                <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
                  {plan.id === "enterprise" && <Building className="w-5 h-5 text-violet-400" />}
                  {plan.id === "free" && <Zap className="w-5 h-5 text-yellow-400" />}
                  {plan.name}
                </h3>
                <div className="text-5xl font-black mb-6">
                  ${plan.price}<span className="text-xl text-zinc-500 font-medium">/mo</span>
                </div>
                
                <button
                  onClick={() => setCurrentPlan(plan.id)}
                  disabled={isActive}
                  className={`w-full py-4 rounded-xl font-bold transition-all mb-8 ${
                    isActive
                      ? "bg-zinc-800 text-zinc-400 cursor-not-allowed border border-zinc-700"
                      : isPro
                        ? "bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_20px_rgba(34,211,238,0.3)]"
                        : "bg-white hover:bg-zinc-200 text-black"
                  }`}
                >
                  {isActive ? "Current Plan" : isPro ? "Upgrade to Pro" : "Select Plan"}
                </button>

                <ul className="space-y-4">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-zinc-300">
                      <Check className={`w-5 h-5 shrink-0 ${isPro ? "text-cyan-400" : "text-zinc-500"}`} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
