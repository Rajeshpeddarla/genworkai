"use client";

import { useEffect, useState } from "react";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBillingStore } from "@/store/billing"; // Assuming billing store exists, or we fetch from API

interface CreditPreviewProps {
  operationKey: string;
  fallbackCost?: number;
  className?: string;
  actionText?: string;
}

export function CreditPreview({ operationKey, fallbackCost = 1, className, actionText = "Consume" }: CreditPreviewProps) {
  const [cost, setCost] = useState<number | null>(null);

  useEffect(() => {
    // In a real implementation, you might fetch this from a context or an API.
    // For now, we simulate fetching the specific cost from the DB cache.
    let isMounted = true;
    fetch(`/api/billing/costs?key=${operationKey}`)
      .then(res => res.json())
      .then(data => {
        if (isMounted && data?.cost !== undefined) {
          setCost(data.cost);
        }
      })
      .catch(() => {
        if (isMounted) setCost(fallbackCost);
      });
    return () => { isMounted = false; };
  }, [operationKey, fallbackCost]);

  const displayCost = cost !== null ? cost : fallbackCost;

  return (
    <div className={cn("inline-flex items-center gap-1.5 px-2 py-1 bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 rounded text-xs font-medium border border-violet-200 dark:border-violet-500/20", className)}>
      <Zap className="w-3 h-3 text-violet-500 fill-violet-500" />
      <span>{displayCost} {displayCost === 1 ? 'Credit' : 'Credits'} to {actionText}</span>
    </div>
  );
}
