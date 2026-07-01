'use client';

import { useState, useEffect } from "react";
import { Loader2, ArrowUpRight, ArrowDownRight, RefreshCw, Zap } from "lucide-react";

interface CreditTransaction {
  id: string;
  amount: number;
  balanceAfter: number;
  reason: string;
  transactionType: string;
  operationId?: string;
  createdAt: string;
}

export function CreditHistoryTab() {
  const [history, setHistory] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/profile/credit-history')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setHistory(data.history);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/10 rounded-3xl p-8 shadow-sm">
        <Loader2 className="w-8 h-8 animate-spin text-fuchsia-500" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/10 rounded-3xl p-8 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-1">Credit Ledger</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">A detailed history of your AI credit usage and refills.</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
            <tr>
              <th className="px-4 py-3 font-medium rounded-l-lg">Date</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-4 py-3 font-medium rounded-r-lg text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                  No credit history found.
                </td>
              </tr>
            ) : (
              history.map((tx) => (
                <tr key={tx.id} className="border-b border-zinc-100 dark:border-zinc-800/50 last:border-0 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                  <td className="px-4 py-4 whitespace-nowrap text-zinc-600 dark:text-zinc-300">
                    {new Date(tx.createdAt).toLocaleString(undefined, { 
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                    })}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider ${
                      tx.transactionType === 'deduction' 
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400' 
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                    }`}>
                      {tx.transactionType === 'deduction' ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                      {tx.transactionType}
                    </span>
                  </td>
                  <td className="px-4 py-4 font-semibold">
                    <span className={tx.transactionType === 'deduction' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>
                      {tx.transactionType === 'deduction' ? '-' : '+'}{tx.amount}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      {tx.transactionType === 'deduction' ? (
                        <Zap className="w-4 h-4 text-zinc-400" />
                      ) : (
                        <RefreshCw className="w-4 h-4 text-zinc-400" />
                      )}
                      <span className="text-zinc-700 dark:text-zinc-200 font-medium">{tx.reason}</span>
                    </div>
                    {tx.operationId && (
                      <div className="text-[10px] text-zinc-400 mt-0.5">Ref: {tx.operationId.substring(0, 12)}...</div>
                    )}
                  </td>
                  <td className="px-4 py-4 text-right font-medium text-zinc-900 dark:text-white">
                    {tx.balanceAfter}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
