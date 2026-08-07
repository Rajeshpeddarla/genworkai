"use client";

import { useEffect, useState, Suspense } from "react";
import { Check, Loader2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import Script from "next/script";
import { useSearchParams } from "next/navigation";

function UpgradePlansContent() {
  const [plans, setPlans] = useState<any[]>([]);
  const [currentPlanId, setCurrentPlanId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState<'INTL' | 'IN'>('INTL');
  const searchParams = useSearchParams();
  const isSuccess = searchParams.get("success") === "true";
  const purchasedPlanId = searchParams.get("purchased_plan_id");
  const orderId = searchParams.get("order_id");
  const paypalSubscriptionId = searchParams.get("subscription_id");

  useEffect(() => {
    // Auto-detect if user is in India
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz.includes('Kolkata') || tz.includes('Calcutta') || tz.includes('Asia/Colombo')) {
      setRegion('IN');
    }

    let attempts = 0;
    const fetchPricing = async () => {
      try {
        const res = await fetch(`/api/pricing?tz=${tz}`);
        const data = await res.json();
        
        // If we just succeeded a checkout, wait for the webhook to update the DB
        // by polling until currentPlanId is the purchased plan, or until max attempts (20 secs max)
        if (isSuccess && purchasedPlanId && data.currentPlanId !== parseInt(purchasedPlanId) && attempts < 10) {
          attempts++;
          
          // Fallback: If Cashfree Webhook hasn't fired, manually verify the order_id
          if (orderId) {
            try {
              await fetch("/api/webhooks/cashfree/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ order_id: orderId })
              });
            } catch (e) {
              // Ignore fallback errors
            }
          }

          // Fallback: If PayPal Webhook hasn't fired, manually verify the subscription_id
          if (paypalSubscriptionId) {
            try {
              await fetch("/api/webhooks/paypal/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subscription_id: paypalSubscriptionId })
              });
            } catch (e) {
              // Ignore fallback errors
            }
          }
          
          setTimeout(fetchPricing, 2000);
          return;
        }

        if (data.plans) setPlans(data.plans);
        if (data.currentPlanId) setCurrentPlanId(data.currentPlanId);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    fetchPricing();
  }, [isSuccess]);

  const handleUpgrade = async (planId: number) => {
    try {
      // Small visual feedback hack
      const prevPlans = [...plans];
      setLoading(true);
      
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, region })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout session failed");
      
      if (data.cashfreeSessionId) {
        if (!(window as any).Cashfree) {
          throw new Error("Payment SDK is still loading, please try again in a few seconds.");
        }
        
        const cashfree = (window as any).Cashfree({
          mode: process.env.NEXT_PUBLIC_ENVIRONMENT === 'production' ? "production" : "sandbox",
        });
        cashfree.checkout({
          paymentSessionId: data.cashfreeSessionId,
          redirectTarget: "_self",
        });
      } else {
        // Redirect to gateway (PayPal etc)
        window.location.href = data.checkoutUrl;
      }
    } catch (err: any) {
      alert("Error: " + err.message);
      setLoading(false);
    }
  };

  return (
    <>
      <Script src="https://sdk.cashfree.com/js/v3/cashfree.js" strategy="afterInteractive" />
      <div className="space-y-8 animate-in fade-in duration-500">
        
        {isSuccess && (
          <div className="max-w-2xl mx-auto mb-6 p-4 border border-green-500/30 bg-green-500/10 rounded-lg text-center text-green-400 font-mono">
            Subscription successfully processed! Your node capacity has been upgraded.
          </div>
        )}

        <div className="text-center max-w-2xl mx-auto mb-10">
          <h1 className="font-pixel text-3xl uppercase tracking-wider mb-4">Node Capacity Upgrade</h1>
          <p className="font-mono text-zinc-400 text-sm mb-4">
            Scale your extraction limits seamlessly. Choose the bandwidth that fits your processing requirements.
          </p>

          <div className="flex justify-center items-center mt-6 space-x-4 border border-zinc-800 bg-black w-fit mx-auto p-1 px-4 rounded-full">
            <span className={`text-xs font-mono font-medium tracking-wide transition-colors ${region === 'INTL' ? 'text-white' : 'text-zinc-500'}`}>INTL (USD)</span>
            <button 
              onClick={() => setRegion(r => r === 'INTL' ? 'IN' : 'INTL')}
              className="relative inline-flex h-5 w-10 items-center rounded-full bg-zinc-800 border border-zinc-700 transition-colors focus:outline-none"
            >
              <span 
                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${region === 'IN' ? 'translate-x-6' : 'translate-x-1'}`}
              />
            </button>
            <span className={`text-xs font-mono font-medium tracking-wide transition-colors ${region === 'IN' ? 'text-white' : 'text-zinc-500'}`}>India (INR)</span>
          </div>
        </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {plans.map((plan, i) => {
            const isFree = plan.priceUsdCents === 0;
            const price = region === 'INTL' ? plan.priceUsdCents : plan.priceInrPaise;
            const discount = region === 'INTL' ? plan.discountUsdCents : plan.discountInrPaise;
            const finalPrice = price - (discount || 0);
            
            const currencySymbol = region === 'INTL' ? '$' : '₹';
            const priceVal = (finalPrice / 100).toFixed(region === 'INTL' ? 2 : 0);
            const originalPriceVal = (price / 100).toFixed(region === 'INTL' ? 2 : 0);

            return (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                key={plan.id}
                className={`border p-6 flex flex-col relative overflow-hidden ${
                  !isFree && finalPrice < 5000 
                    ? "border-cyan-500/50 bg-zinc-50 dark:bg-[#050505]" 
                    : "border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20 bg-white dark:bg-black"
                }`}
              >
                {!isFree && finalPrice < 5000 && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-3xl pointer-events-none" />
                )}
                
                <div className="mb-6 relative z-10">
                  <h3 className="font-pixel text-xl uppercase text-black dark:text-white mb-2">{plan.name}</h3>
                  <div className="flex flex-col mb-4">
                    {discount > 0 && (
                      <span className="font-mono text-xs text-zinc-500 line-through mb-1">
                        {currencySymbol}{originalPriceVal}
                      </span>
                    )}
                    <div className="flex items-end gap-1">
                      <span className="font-mono text-3xl text-cyan-400">{currencySymbol}{priceVal}</span>
                      {!isFree && <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest mb-1">/mo</span>}
                    </div>
                  </div>
                  <p className="font-mono text-xs text-zinc-400 border-t border-zinc-200 dark:border-white/10 pt-4 mt-2">
                    <span className="text-black dark:text-white font-bold">{plan.pageExtractionLimit.toLocaleString()}</span> pages/month
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
                  {!isFree && (
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                      <span className="font-mono text-[10px] sm:text-xs text-zinc-700 dark:text-zinc-300">Priority Processing</span>
                    </div>
                  )}
                  {plan.pageExtractionLimit >= 10000 && (
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
                </div>

                <button
                  onClick={() => handleUpgrade(plan.id)}
                  className={`w-full py-3 font-bold flex items-center justify-center gap-2 transition-colors uppercase tracking-widest text-xs relative z-10 ${
                    plan.id === currentPlanId
                      ? "bg-black dark:bg-white text-white dark:text-black cursor-default"
                      : !isFree && finalPrice < 5000
                        ? "bg-[#014b5c] dark:bg-cyan-500 hover:bg-[#013b4c] dark:hover:bg-cyan-400 text-white dark:text-black"
                        : "bg-black dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-black"
                  }`}
                  disabled={plan.id === currentPlanId}
                >
                  {plan.id === currentPlanId ? "Current Node" : "Deploy Upgrade"} 
                  {plan.id !== currentPlanId && <ArrowRight className="w-4 h-4" />}
                </button>
              </motion.div>
            );
          })}
        </div>
      )}

    </div>
    </>
  );
}

export default function UpgradePlansPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    }>
      <UpgradePlansContent />
    </Suspense>
  );
}
