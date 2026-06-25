import { createClient } from '../../../../utils/supabase/server';
import { redirect } from 'next/navigation';
import { db } from '../../../../db';
import { apiUsageCounters, profiles } from '../../../../db/schema';
import { eq, and } from 'drizzle-orm';
import { EntitlementEngine } from '../../../../lib/billing/entitlements';
import { BarChart, Activity, Database, Sparkles, MessageSquare, Code } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function DeveloperUsagePage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const period = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  
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

  const limitCheck = await EntitlementEngine.checkLimit({ userId: session.user.id, resource: 'api_requests' });
  const actualLimit = limitCheck.limit ?? Infinity;
  const isUnlimited = actualLimit === Infinity;
  const progress = isUnlimited ? 0 : Math.min(100, (usage.requests / actualLimit) * 100);

  return (
    <div className="p-8 lg:p-12 max-w-7xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-bold">Usage & Billing</h1>
        <p className="text-neutral-500 mt-2">Monitor your platform consumption and manage your subscription limits.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Main Quota Card */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-8 shadow-sm">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Activity className="w-5 h-5 text-violet-500" /> API Requests (This Month)</h2>
          
          <div className="flex items-end justify-between mb-2">
            <span className="text-4xl font-bold">{usage.requests.toLocaleString()}</span>
            <span className="text-neutral-500 font-medium">of {isUnlimited ? 'Unlimited' : actualLimit.toLocaleString()} limit</span>
          </div>
          
          <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-3 mb-6">
            <div 
              className={`h-3 rounded-full ${progress > 90 ? 'bg-red-500' : progress > 75 ? 'bg-yellow-500' : 'bg-violet-500'}`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 bg-neutral-50 dark:bg-black rounded-lg border border-neutral-200 dark:border-neutral-800">
              <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Concurrency</h4>
              <p className="text-lg font-bold">{tier === 'pro' ? '50 / sec' : '5 / sec'}</p>
            </div>
            <div className="p-4 bg-neutral-50 dark:bg-black rounded-lg border border-neutral-200 dark:border-neutral-800">
              <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Current Plan</h4>
              <p className="text-lg font-bold capitalize">{tier}</p>
            </div>
          </div>
        </div>

        {/* Upgrade Card */}
        <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-xl p-8 shadow-sm text-white flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold mb-2">Upgrade to Pro</h2>
            <p className="text-white/80 text-sm mb-6">Unleash the full power of GenWorkAI with enterprise-grade limits and dedicated infrastructure.</p>
            <ul className="space-y-3 text-sm font-medium">
              <li className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-violet-300" /> 100,000 API Requests / mo</li>
              <li className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-violet-300" /> 50 Req/sec Concurrency</li>
              <li className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-violet-300" /> Advanced DB Intelligence</li>
              <li className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-violet-300" /> Unlimited Knowledge Bases</li>
            </ul>
          </div>
          <Link href="/settings/billing" className="mt-8 bg-white text-violet-900 hover:bg-neutral-100 text-center py-3 rounded-lg font-bold transition-colors">
            Manage Subscription
          </Link>
        </div>

      </div>

      <h2 className="text-xl font-bold mt-12 mb-6">Detailed Metrics</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 text-neutral-500 mb-2">
            <MessageSquare className="w-5 h-5" />
            <h4 className="font-semibold">LLM Tokens</h4>
          </div>
          <p className="text-3xl font-bold">{usage.llmTokens.toLocaleString()}</p>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 text-neutral-500 mb-2">
            <Database className="w-5 h-5" />
            <h4 className="font-semibold">Vector Searches</h4>
          </div>
          <p className="text-3xl font-bold">{usage.vectorSearches.toLocaleString()}</p>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 text-neutral-500 mb-2">
            <Code className="w-5 h-5" />
            <h4 className="font-semibold">DB Queries</h4>
          </div>
          <p className="text-3xl font-bold">{usage.dbQueries.toLocaleString()}</p>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 text-neutral-500 mb-2">
            <BarChart className="w-5 h-5" />
            <h4 className="font-semibold">Generated Artifacts</h4>
          </div>
          <p className="text-3xl font-bold">{usage.generatedArtifacts.toLocaleString()}</p>
        </div>

      </div>

    </div>
  );
}