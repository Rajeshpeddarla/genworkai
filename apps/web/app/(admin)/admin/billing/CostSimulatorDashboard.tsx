"use client";

import React, { useState, useEffect } from 'react';


type CostConfig = {
  operationKey: string;
  displayName: string;
  credits: number;
  avgInput: number;
  avgOutput: number;
};

type ProviderCosts = {
  creditValueUSD: number;
  deepseekInput: number;
  deepseekOutput: number;
  jinaEmbedding: number;
  jinaReranker: number;
};

export function CostSimulatorDashboard({ 
  initialCosts,
  initialProviderCosts 
}: { 
  initialCosts: any[],
  initialProviderCosts: ProviderCosts 
}) {
  const [providerCosts, setProviderCosts] = useState<ProviderCosts>(initialProviderCosts);
  const [operations, setOperations] = useState<CostConfig[]>(() => {
    // Default mock token usage for simulation
    const mockUsage: Record<string, { in: number, out: number }> = {
      workspace_chat: { in: 800, out: 700 },
      knowledge_chat: { in: 3000, out: 800 },
      summary_generation: { in: 15000, out: 500 },
      document_generation: { in: 25000, out: 3000 },
      ocr: { in: 500, out: 500 },
    };

    return initialCosts.map(c => ({
      operationKey: c.operationKey,
      displayName: c.displayName,
      credits: c.credits,
      avgInput: mockUsage[c.operationKey]?.in || 1000,
      avgOutput: mockUsage[c.operationKey]?.out || 1000,
    }));
  });

  const handleProviderChange = (key: keyof ProviderCosts, val: string) => {
    setProviderCosts(prev => ({ ...prev, [key]: parseFloat(val) || 0 }));
  };

  const calculateRow = (op: CostConfig) => {
    // Costs are per 1M tokens
    const inputCost = (op.avgInput / 1000000) * providerCosts.deepseekInput;
    const outputCost = (op.avgOutput / 1000000) * providerCosts.deepseekOutput;
    
    // We can add embedding costs as a flat modifier for knowledge operations if needed
    let additionalCost = 0;
    if (op.operationKey.includes("knowledge") || op.operationKey === "semantic_search") {
      additionalCost = (5000 / 1000000) * providerCosts.jinaEmbedding;
    }

    const totalProviderCost = inputCost + outputCost + additionalCost;
    const revenue = op.credits * providerCosts.creditValueUSD;
    const profit = revenue - totalProviderCost;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

    return { totalProviderCost, revenue, profit, margin };
  };

  const getMarginBadge = (margin: number) => {
    if (margin > 40) return <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-500 text-white">{margin.toFixed(0)}% (Healthy)</span>;
    if (margin > 20) return <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-yellow-500 text-white">{margin.toFixed(0)}% (Acceptable)</span>;
    return <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-red-500 text-white">{margin.toFixed(0)}% (Low/Loss)</span>;
  };

  const getRecommendation = (margin: number, op: CostConfig) => {
    if (margin < 20) return `Consider increasing cost from ${op.credits} to ${op.credits + 1} Credits`;
    if (margin > 80) return `High margin. Safe to reduce cost to ${Math.max(1, op.credits - 1)} if desired.`;
    return 'Operating optimally.';
  };

  return (
    <div className="space-y-8 mt-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">AI Economy & Cost Simulator</h2>
        <p className="text-muted-foreground">Adjust provider costs and token estimates to ensure profitable margins.</p>
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow">
        <div className="flex flex-col space-y-1.5 p-6">
          <h3 className="font-semibold leading-none tracking-tight">AI Provider Costs (Per 1M Tokens)</h3>
          <p className="text-sm text-muted-foreground">Update these values to simulate changes in upstream pricing.</p>
        </div>
        <div className="p-6 pt-0 grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Credit Value (USD)</label>
            <input className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" type="number" step="0.001" value={providerCosts.creditValueUSD} onChange={e => handleProviderChange('creditValueUSD', e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">DeepSeek Input</label>
            <input className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" type="number" step="0.01" value={providerCosts.deepseekInput} onChange={e => handleProviderChange('deepseekInput', e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">DeepSeek Output</label>
            <input className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" type="number" step="0.01" value={providerCosts.deepseekOutput} onChange={e => handleProviderChange('deepseekOutput', e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Jina Embed</label>
            <input className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" type="number" step="0.01" value={providerCosts.jinaEmbedding} onChange={e => handleProviderChange('jinaEmbedding', e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Jina Reranker</label>
            <input className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" type="number" step="0.01" value={providerCosts.jinaReranker} onChange={e => handleProviderChange('jinaReranker', e.target.value)} />
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow mt-6">
        <div className="flex flex-col space-y-1.5 p-6">
          <h3 className="font-semibold leading-none tracking-tight">Simulation Table</h3>
          <p className="text-sm text-muted-foreground">Real-time profitability calculations based on average token usage.</p>
        </div>
        <div className="p-6 pt-0">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Operation</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Cost</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Avg Input (T)</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Avg Output (T)</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Est. Provider Cost</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Revenue</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Margin</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Recommendation</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {operations.map(op => {
                  const metrics = calculateRow(op);
                  return (
                    <tr key={op.operationKey} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <td className="p-4 align-middle font-medium">{op.displayName}</td>
                      <td className="p-4 align-middle">{op.credits} cr</td>
                      <td className="p-4 align-middle">
                        <input className="flex h-9 w-24 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" type="number" value={op.avgInput} onChange={(e) => {
                          const newOps = [...operations];
                          const idx = newOps.findIndex(o => o.operationKey === op.operationKey);
                          if (idx !== -1 && newOps[idx]) {
                            newOps[idx]!.avgInput = parseInt(e.target.value) || 0;
                            setOperations(newOps);
                          }
                        }} />
                      </td>
                      <td className="p-4 align-middle">
                        <input className="flex h-9 w-24 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" type="number" value={op.avgOutput} onChange={(e) => {
                          const newOps = [...operations];
                          const idx = newOps.findIndex(o => o.operationKey === op.operationKey);
                          if (idx !== -1 && newOps[idx]) {
                            newOps[idx]!.avgOutput = parseInt(e.target.value) || 0;
                            setOperations(newOps);
                          }
                        }} />
                      </td>
                      <td className="p-4 align-middle">${metrics.totalProviderCost.toFixed(5)}</td>
                      <td className="p-4 align-middle">${metrics.revenue.toFixed(5)}</td>
                      <td className="p-4 align-middle">{getMarginBadge(metrics.margin)}</td>
                      <td className="p-4 align-middle text-xs text-muted-foreground">{getRecommendation(metrics.margin, op)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
