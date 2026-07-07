'use client';

export default function ApiAnalytics() {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">API Analytics</h1>
          <p className="text-neutral-500 mt-2">Metrics for study-plan-generator</p>
        </div>
        <select className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-2 text-sm font-medium">
          <option>Last 7 Days</option>
          <option>Last 30 Days</option>
          <option>This Month</option>
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6">
          <div className="text-sm text-neutral-500 mb-1">Total Requests</div>
          <div className="text-3xl font-bold">12,405</div>
          <div className="text-xs text-green-500 font-bold mt-2">↑ 14% vs last week</div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6">
          <div className="text-sm text-neutral-500 mb-1">Avg Latency</div>
          <div className="text-3xl font-bold">840ms</div>
          <div className="text-xs text-green-500 font-bold mt-2">↓ 5% vs last week</div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6">
          <div className="text-sm text-neutral-500 mb-1">Tokens Used</div>
          <div className="text-3xl font-bold">2.4M</div>
          <div className="text-xs text-red-500 font-bold mt-2">↑ 22% vs last week</div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6">
          <div className="text-sm text-neutral-500 mb-1">Error Rate</div>
          <div className="text-3xl font-bold">0.12%</div>
          <div className="text-xs text-neutral-500 font-bold mt-2">Same as last week</div>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-8 mb-8 h-[400px] flex items-center justify-center text-neutral-500">
        [ Chart Placeholder: Requests over time ]
      </div>
    </div>
  );
}
