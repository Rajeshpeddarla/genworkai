import { Activity, CheckCircle2, Clock } from 'lucide-react';

export default function DeveloperStatusPage() {
  return (
    <div className="p-8 lg:p-12 max-w-7xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-bold">API Status</h1>
        <p className="text-neutral-500 mt-2">Real-time monitoring of GenWorkAI infrastructure.</p>
      </div>

      <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 rounded-xl p-8 mb-12 flex items-center gap-6">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-500 rounded-full flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-green-800 dark:text-green-400 mb-1">All Systems Operational</h2>
          <p className="text-green-600 dark:text-green-500/80">Last updated: Just now</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-6">
          <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-2">API Routing</h3>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">100%</span>
            <span className="text-green-500 text-sm font-bold">Operational</span>
          </div>
        </div>
        <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-6">
          <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-2">Vector Database</h3>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">100%</span>
            <span className="text-green-500 text-sm font-bold">Operational</span>
          </div>
        </div>
        <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-6">
          <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-2">Background Workers</h3>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">100%</span>
            <span className="text-green-500 text-sm font-bold">Operational</span>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-6">Recent Events</h2>
      <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-white dark:bg-neutral-900">
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex gap-4">
          <div className="mt-1"><Clock className="w-5 h-5 text-neutral-400" /></div>
          <div>
            <h4 className="font-bold mb-1">No incidents reported today.</h4>
            <p className="text-sm text-neutral-500">All services have been running smoothly for the past 24 hours.</p>
          </div>
        </div>
        <div className="p-6 flex gap-4 bg-neutral-50 dark:bg-black/50">
          <div className="mt-1"><Activity className="w-5 h-5 text-neutral-400" /></div>
          <div>
            <h4 className="font-bold mb-1">Scheduled Maintenance Completed</h4>
            <p className="text-sm text-neutral-500 mb-2">We successfully migrated the Vector Database to a new cluster to improve latency.</p>
            <span className="text-xs text-neutral-400">June 20, 2026</span>
          </div>
        </div>
      </div>
    </div>
  );
}