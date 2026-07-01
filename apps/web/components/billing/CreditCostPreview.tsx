"use client";

import { useEffect, useState } from "react";
import { Zap, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface CreditCostPreviewProps {
  operationKey: string;
  multiplier?: number;
  className?: string;
}

export function CreditCostPreview({ operationKey, multiplier = 1, className }: CreditCostPreviewProps) {
  const [cost, setCost] = useState<number | null>(null);
  const [available, setAvailable] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    Promise.all([
      fetch(`/api/billing/costs?key=${operationKey}`).then(r => r.json()),
      fetch(`/api/profile`).then(r => r.json())
    ])
    .then(([costData, profileData]) => {
      if (isMounted) {
        setCost(costData.cost !== undefined ? costData.cost * multiplier : null);
        const aiCredits = profileData?.limits?.aiCredits;
        if (aiCredits) {
          setAvailable(aiCredits.current);
        }
        setLoading(false);
      }
    })
    .catch((err) => {
      console.error("Failed to load credit preview:", err);
      if (isMounted) setLoading(false);
    });

    return () => { isMounted = false; };
  }, [operationKey, multiplier]);

  if (loading) {
    return (
      <div className={cn("flex items-center gap-2 text-xs text-zinc-400 animate-pulse", className)}>
        <Zap className="w-3.5 h-3.5" /> Calculating AI cost...
      </div>
    );
  }

  if (cost === null || cost === 0) {
    return null; // Don't show if cost is 0 or not found
  }

  const hasEnough = available !== null && available >= cost;

  return (
    <div className={cn(
      "flex items-center gap-3 text-xs font-medium px-3 py-2 rounded-lg border",
      hasEnough 
        ? "bg-zinc-50 border-zinc-200 text-zinc-600 dark:bg-white/5 dark:border-white/10 dark:text-zinc-400"
        : "bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400",
      className
    )}>
      <div className="flex items-center gap-1.5">
        <Zap className={cn("w-3.5 h-3.5", hasEnough ? "text-violet-500" : "text-rose-500")} />
        <span>Estimated Cost: <strong>{cost} Credits</strong></span>
      </div>
      
      <div className="w-px h-3 bg-zinc-300 dark:bg-zinc-700 mx-1" />
      
      {available !== null && (
        <div className="flex items-center gap-1.5">
          <span>Available: {available.toLocaleString()}</span>
          {!hasEnough && (
            <span className="flex items-center gap-1 ml-1 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-3.5 h-3.5" />
              Insufficient
            </span>
          )}
        </div>
      )}
      
      {!hasEnough && (
        <Link href="/billing" className="ml-auto underline hover:text-rose-700 dark:hover:text-rose-300">
          Add Funds
        </Link>
      )}
    </div>
  );
}
