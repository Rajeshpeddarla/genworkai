"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { initializePaddle, Paddle } from "@paddle/paddle-js";
import { useSearchParams } from "next/navigation";

export default function CreditPacksClient({ packs }: { packs: any[] }) {
  const [paddle, setPaddle] = useState<Paddle | null>(null);
  const [localizedPrices, setLocalizedPrices] = useState<Record<string, string>>({});
  const [isLoadingPrices, setIsLoadingPrices] = useState(true);
  const searchParams = useSearchParams();

  useEffect(() => {
    initializePaddle({ environment: process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT === 'sandbox' ? 'sandbox' : 'production', token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || '' })
      .then((paddleInstance) => {
        if (paddleInstance) {
          setPaddle(paddleInstance);

          // Fetch localized prices
          const priceIds = packs.map(p => p.paddlePriceId).filter(Boolean);
          if (priceIds.length > 0) {
            paddleInstance.PricePreview({
              items: priceIds.map(id => ({ priceId: id, quantity: 1 }))
            }).then(preview => {
              const newPrices: Record<string, string> = {};
              preview.data.details.lineItems.forEach((item: any) => {
                newPrices[item.price.id] = item.formattedTotals.total;
              });
              setLocalizedPrices(newPrices);
              setIsLoadingPrices(false);
            }).catch(err => {
              console.error("Paddle PricePreview Error:", err);
              setIsLoadingPrices(false);
            });
          } else {
            setIsLoadingPrices(false);
          }

          const checkoutSlug = searchParams.get('checkout');
          if (checkoutSlug) {
            setTimeout(() => {
              paddleInstance.Checkout.open({
                items: [{ priceId: checkoutSlug, quantity: 1 }],
              });
            }, 500);
          }
        }
      });
  }, [searchParams]);

  const handleCheckout = (priceId: string | null) => {
    if (!priceId) {
      alert("Missing Price ID. Please contact support.");
      return;
    }
    if (paddle) {
      paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
      });
    } else {
      alert("Billing gateway is still initializing. Please refresh and try again.");
    }
  };

  if (packs.length === 0) {
    return (
      <div className="col-span-3 text-center py-12 text-neutral-500 border border-dashed border-neutral-300 dark:border-neutral-800 rounded-xl">
        No credit packs are available for purchase at the moment.
      </div>
    );
  }

  return (
    <>
      {packs.map((pack) => (
        <div key={pack.id} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col">
          <h3 className="text-xl font-bold mb-2">{pack.name}</h3>
          <div className="text-4xl font-bold mb-4 h-10 flex items-center">
            {isLoadingPrices ? (
              <div className="h-8 w-24 bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded-md"></div>
            ) : (
              <>{pack.paddlePriceId && localizedPrices[pack.paddlePriceId] ? localizedPrices[pack.paddlePriceId] : `$${(pack.priceCents / 100).toFixed(2)}`}</>
            )}
          </div>
          
          <ul className="space-y-4 mb-8 flex-grow">
            <li className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
              <span className="font-medium">{pack.credits.toLocaleString()} AI Credits</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
              <span className="font-medium text-neutral-600 dark:text-neutral-400">Never expires</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
              <span className="font-medium text-neutral-600 dark:text-neutral-400">Consumed after monthly quota</span>
            </li>
          </ul>

          <button 
            onClick={() => handleCheckout(pack.paddlePriceId)}
            className="w-full bg-neutral-900 hover:bg-black dark:bg-white dark:hover:bg-neutral-200 dark:text-black text-white font-bold py-3 px-4 rounded-xl transition-colors"
          >
            Purchase Pack
          </button>
        </div>
      ))}
    </>
  );
}
