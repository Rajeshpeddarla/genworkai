'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, X, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export function GlobalQuotaToast() {
  const [show, setShow] = useState(false);
  const [level, setLevel] = useState<number | null>(null); // 75, 90, or 100
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleExhausted = () => {
      setLevel(100);
      setMessage("Monthly quota reached. Upgrade your subscription to continue.");
      setShow(true);
    };

    const handleWarning = (e: any) => {
      const wLevel = e.detail?.level;
      if (wLevel === 75 && level !== 100 && level !== 90) {
        setLevel(75);
        setMessage("You've used 75% of your monthly API quota.");
        setShow(true);
      } else if (wLevel === 90 && level !== 100) {
        setLevel(90);
        setMessage("You're almost out of API requests.");
        setShow(true);
      }
    };

    window.addEventListener('gk-quota-exhausted', handleExhausted);
    window.addEventListener('gk-quota-warning', handleWarning);

    return () => {
      window.removeEventListener('gk-quota-exhausted', handleExhausted);
      window.removeEventListener('gk-quota-warning', handleWarning);
    };
  }, [level]);

  if (!show) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className={`p-4 rounded-xl shadow-xl border flex flex-col gap-3 max-w-sm w-full ${
        level === 100 ? 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-900' :
        level === 90 ? 'bg-orange-50 dark:bg-orange-950/50 border-orange-200 dark:border-orange-900' :
        'bg-yellow-50 dark:bg-yellow-950/50 border-yellow-200 dark:border-yellow-900'
      }`}>
        <div className="flex items-start gap-3">
          <AlertCircle className={`w-5 h-5 shrink-0 mt-0.5 ${
            level === 100 ? 'text-red-500' : level === 90 ? 'text-orange-500' : 'text-yellow-500'
          }`} />
          <div className="flex-1">
            <h4 className={`font-bold text-sm ${
              level === 100 ? 'text-red-800 dark:text-red-200' : 
              level === 90 ? 'text-orange-800 dark:text-orange-200' : 
              'text-yellow-800 dark:text-yellow-200'
            }`}>
              {level === 100 ? 'Quota Exhausted' : 'Usage Warning'}
            </h4>
            <p className={`text-sm mt-1 ${
              level === 100 ? 'text-red-600 dark:text-red-300' : 
              level === 90 ? 'text-orange-600 dark:text-orange-300' : 
              'text-yellow-600 dark:text-yellow-300'
            }`}>
              {message}
            </p>
          </div>
          <button onClick={() => setShow(false)} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex justify-end gap-2 mt-1">
          <Link 
            href="/developer/usage" 
            onClick={() => setShow(false)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40 transition-colors flex items-center gap-1 border border-transparent hover:border-neutral-200 dark:hover:border-neutral-800"
          >
            View Dashboard
          </Link>
          <Link 
            href="/pricing" 
            onClick={() => setShow(false)}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors ${
              level === 100 
                ? 'bg-red-600 text-white hover:bg-red-700' 
                : level === 90
                  ? 'bg-orange-600 text-white hover:bg-orange-700'
                  : 'bg-yellow-600 text-white hover:bg-yellow-700'
            }`}
          >
            Upgrade Plan <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
