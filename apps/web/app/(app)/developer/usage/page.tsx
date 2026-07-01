import { createClient } from '../../../../utils/supabase/server';
import { redirect } from 'next/navigation';
import { db } from '../../../../db';
import { apiUsageCounters, profiles, subscriptionPlans } from '../../../../db/schema';
import { eq, and } from 'drizzle-orm';
import { EntitlementEngine } from '../../../../lib/billing/entitlements';
import { UsageService } from '../../../../lib/billing/UsageService';
import { Activity, Database, Sparkles, MessageSquare, Key, LayoutGrid, Zap, HardDrive, PackagePlus } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

export default async function DeveloperUsagePage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const now = new Date();
  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const daysInMonth = getDaysInMonth(now.getFullYear(), now.getMonth() + 1);
  const currentDay = now.getDate();
  
  const [profileRes, usageRes] = await Promise.all([
    db.select().from(profiles).where(eq(profiles.id, session.user.id)).limit(1),
    db.select().from(apiUsageCounters).where(
      and(
        eq(apiUsageCounters.userId, session.user.id),
        eq(apiUsageCounters.period, period)
      )
    ).limit(1)
  ]);

  const profile = profileRes[0];
  const usage = usageRes[0] || { requests: 0, llmTokens: 0, dbQueries: 0, vectorSearches: 0, generatedArtifacts: 0 };
  const tier = profile?.tier || 'free';

  const plan = await db.query.subscriptionPlans.findFirst({ where: eq(subscriptionPlans.slug, tier) });
  
  // API Requests Balance
  const balance = await UsageService.getOrCreateBalance(session.user.id);
  const monthlyRemaining = balance?.monthlyRemainingCredits ?? 0;
  const purchasedRemaining = balance?.purchasedRemainingCredits ?? 0;
  const totalRemaining = monthlyRemaining + purchasedRemaining;
  const monthlyTotal = profile?.isAdmin ? -1 : (plan?.monthlyAiCredits ?? 0);
  const isUnlimitedAPI = monthlyTotal === -1;
  
  // Forecast
  const consumedMonthly = isUnlimitedAPI ? 0 : Math.max(0, monthlyTotal - monthlyRemaining);
  const dailyAverage = currentDay > 0 ? Math.floor(consumedMonthly / currentDay) : 0;
  const estimatedMonthEnd = isUnlimitedAPI ? 0 : dailyAverage * daysInMonth;
  const isForecastExceeding = !isUnlimitedAPI && monthlyTotal > 0 && estimatedMonthEnd > monthlyTotal;

  // Check other resource limits dynamically
  const resources = [
    { key: 'api_keys', label: 'API Keys', icon: Key, value: 0 },
    { key: 'knowledge_bases', label: 'Knowledge Bases', icon: Database, value: 0 },
    { key: 'database_connections', label: 'Database Connections', icon: HardDrive, value: 0 },
    { key: 'automations', label: 'Automation Tasks', icon: Zap, value: 0 },
    { key: 'mcp_servers', label: 'MCP Servers', icon: Zap, value: 0 },
  ] as const;

  const limits = await Promise.all(
    resources.map(r => EntitlementEngine.checkLimit({ userId: session.user.id, resource: r.key as any }))
  );

  return (
    <div className="p-8 lg:p-12 max-w-7xl mx-auto">
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Quota & Usage Dashboard</h1>
          <p className="text-neutral-500 mt-2">Monitor your platform consumption and manage your subscription limits.</p>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-4 py-2 shadow-sm">
            <span className="text-neutral-500">Current Plan:</span> <span className="font-bold capitalize">{tier}</span>
          </div>
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-4 py-2 shadow-sm">
            <span className="text-neutral-500">Billing Period:</span> <span className="font-bold">{period}</span>
          </div>
        </div>
      </div>

      <div className="mb-12">
        {/* API Requests & Forecasting Card */}
        <div className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-8 shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2"><Activity className="w-5 h-5 text-violet-500" /> AI Credit Balance</h2>
            <Link href="/developer/request-packs" className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
              <PackagePlus className="w-4 h-4" /> Buy Credit Pack
            </Link>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <p className="text-sm text-neutral-500 font-medium mb-1">Monthly Plan Quota</p>
              <div className="flex items-end justify-between mb-2">
                <span className="text-3xl font-bold">{isUnlimitedAPI ? "Unlimited" : monthlyRemaining.toLocaleString()}</span>
                {!isUnlimitedAPI && <span className="text-neutral-500 font-medium">/ {monthlyTotal.toLocaleString()} remaining</span>}
              </div>
              <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all ${isUnlimitedAPI ? 'bg-green-500' : monthlyRemaining < (monthlyTotal * 0.1) ? 'bg-red-500' : monthlyRemaining < (monthlyTotal * 0.25) ? 'bg-orange-500' : 'bg-violet-500'}`}
                  style={{ width: `${isUnlimitedAPI ? 100 : monthlyTotal > 0 ? Math.min(100, (monthlyRemaining / monthlyTotal) * 100) : 100}%` }}
                />
              </div>
            </div>
            
            <div className="border-l border-neutral-200 dark:border-neutral-800 pl-8">
              <p className="text-sm text-neutral-500 font-medium mb-1">Purchased Pack Quota</p>
              <div className="flex items-end mb-2">
                <span className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{purchasedRemaining.toLocaleString()}</span>
                <span className="text-neutral-500 font-medium ml-2">remaining</span>
              </div>
              <p className="text-xs text-neutral-500">Never expires. Consumed after monthly quota.</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="p-4 bg-neutral-50 dark:bg-black rounded-lg border border-neutral-200 dark:border-neutral-800">
              <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Total Available</h4>
              <p className="text-xl font-bold text-violet-600 dark:text-violet-400">{isUnlimitedAPI ? "Unlimited" : totalRemaining.toLocaleString()}</p>
            </div>
            <div className={`p-4 rounded-lg border ${isForecastExceeding ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900' : 'bg-neutral-50 dark:bg-black border-neutral-200 dark:border-neutral-800'}`}>
              <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Est. Month End Usage</h4>
              <p className={`text-xl font-bold ${isForecastExceeding ? 'text-red-600 dark:text-red-400' : ''}`}>
                {isUnlimitedAPI ? "N/A" : estimatedMonthEnd.toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-neutral-50 dark:bg-black rounded-lg border border-neutral-200 dark:border-neutral-800 flex flex-col justify-center">
              <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Status</h4>
              <p className={`text-sm font-bold flex items-center gap-1 ${!isUnlimitedAPI && totalRemaining === 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                {!isUnlimitedAPI && totalRemaining === 0 ? 'Quota Exhausted' : '✓ Active'}
              </p>
            </div>
          </div>
        </div>

      </div>

      <h2 className="text-xl font-bold mb-6">Resource Quotas</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {resources.map((resource, idx) => {
          const limitInfo = limits[idx]!;
          const actualLimit = limitInfo.limit ?? Infinity;
          const isUnlimited = actualLimit === Infinity || actualLimit === -1;
          const currentUsage = limitInfo.currentUsage ?? 0;
          const progress = isUnlimited ? 0 : Math.min(100, (currentUsage / actualLimit) * 100);

          return (
            <div key={resource.key} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 text-neutral-800 dark:text-neutral-200 mb-4">
                <resource.icon className="w-5 h-5 text-violet-500" />
                <h4 className="font-bold">{resource.label}</h4>
              </div>
              
              <div className="flex items-end justify-between mb-2">
                <span className="text-2xl font-bold">{currentUsage}</span>
                <span className="text-neutral-500 text-sm font-medium">/ {isUnlimited ? 'Unlimited' : actualLimit}</span>
              </div>
              
              <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2 mb-2">
                <div 
                  className={`h-2 rounded-full ${progress > 90 ? 'bg-red-500' : progress > 75 ? 'bg-orange-500' : 'bg-violet-500'}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              {progress > 90 && (
                <p className="text-xs text-red-500 font-medium">Approaching limit. Consider upgrading.</p>
              )}
            </div>
          );
        })}
      </div>

      <h2 className="text-xl font-bold mb-6">Network Limits</h2>
      <div className="grid md:grid-cols-2 gap-6 mb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 text-neutral-800 dark:text-neutral-200 mb-2">
            <Zap className="w-5 h-5 text-violet-500" />
            <h4 className="font-bold">Concurrency Limit</h4>
          </div>
          <p className="text-neutral-500 text-sm mb-4">Maximum number of parallel requests you can make at the exact same moment.</p>
          <span className="text-2xl font-bold">{plan?.concurrencyLimit ?? 5} / sec</span>
        </div>
        
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 text-neutral-800 dark:text-neutral-200 mb-2">
            <Activity className="w-5 h-5 text-violet-500" />
            <h4 className="font-bold">Rate Limit</h4>
          </div>
          <p className="text-neutral-500 text-sm mb-4">Maximum number of API requests allowed within a moving 1-minute window.</p>
          <span className="text-2xl font-bold">{plan?.rateLimit ?? 60} / min</span>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-6">Detailed Analytics</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 text-neutral-500 mb-2">
            <MessageSquare className="w-5 h-5" />
            <h4 className="font-semibold text-sm">LLM Tokens</h4>
          </div>
          <span className="text-3xl font-bold">{usage.llmTokens.toLocaleString()}</span>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 text-neutral-500 mb-2">
            <Database className="w-5 h-5" />
            <h4 className="font-semibold text-sm">DB Queries</h4>
          </div>
          <span className="text-3xl font-bold">{usage.dbQueries.toLocaleString()}</span>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 text-neutral-500 mb-2">
            <Sparkles className="w-5 h-5" />
            <h4 className="font-semibold text-sm">Vector Searches</h4>
          </div>
          <span className="text-3xl font-bold">{usage.vectorSearches.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}