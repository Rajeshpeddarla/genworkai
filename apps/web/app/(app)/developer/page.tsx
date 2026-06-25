import { createClient } from '../../../utils/supabase/server';
import { redirect } from 'next/navigation';
import { db } from '../../../db';
import { apiKeys, profiles, knowledgeBases, connectedDatabases, automationTasks, mcpServers, apiUsageCounters } from '../../../db/schema';
import { eq, and } from 'drizzle-orm';
import { EntitlementEngine } from '../../../lib/billing/entitlements';
import Link from 'next/link';
import { Activity, Key, Database, Zap, Bot, Server, ArrowRight } from 'lucide-react';

export default async function DeveloperDashboardPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/login');
  }

  // Fetch all counts in parallel
  const [
    userProfileRes,
    keysRes,
    kbsRes,
    dbsRes,
    automationsRes,
    mcpRes,
    usageRes
  ] = await Promise.all([
    db.select().from(profiles).where(eq(profiles.id, session.user.id)).limit(1),
    db.select().from(apiKeys).where(and(eq(apiKeys.userId, session.user.id), eq(apiKeys.status, 'active'))),
    db.select().from(knowledgeBases).where(eq(knowledgeBases.userId, session.user.id)),
    db.select().from(connectedDatabases).where(eq(connectedDatabases.userId, session.user.id)),
    db.select().from(automationTasks).where(eq(automationTasks.userId, session.user.id)),
    db.select().from(mcpServers).where(eq(mcpServers.userId, session.user.id)),
    db.select().from(apiUsageCounters).where(
      and(
        eq(apiUsageCounters.userId, session.user.id), 
        eq(apiUsageCounters.period, `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`)
      )
    ).limit(1)
  ]);

  const profile = userProfileRes[0];
  const usage = usageRes[0] || { requests: 0 };
  const tier = profile?.tier || 'free';

  const limitCheck = await EntitlementEngine.checkLimit({ userId: session.user.id, resource: 'api_requests' });
  const actualLimit = limitCheck.limit ?? Infinity;
  const limitStr = actualLimit === Infinity ? 'Unlimited' : actualLimit.toLocaleString();
  const requestsUsed = usage.requests.toLocaleString();

  return (
    <div className="p-8 lg:p-12 max-w-7xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-bold">Developer Overview</h1>
        <p className="text-neutral-500 mt-2">Manage your API integrations, monitor usage, and test endpoints.</p>
      </div>

      {/* Top Health Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-neutral-500">Current Plan</p>
              <h3 className="text-2xl font-bold capitalize mt-1">{tier}</h3>
            </div>
            <div className="p-2 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-lg">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <Link href="/settings/billing" className="text-sm text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1">
            Manage Subscription <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-neutral-500">API Requests (This Month)</p>
              <h3 className="text-2xl font-bold mt-1">{requestsUsed} <span className="text-sm font-normal text-neutral-500">/ {limitStr}</span></h3>
            </div>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5 mt-4">
            <div 
              className="bg-blue-500 h-1.5 rounded-full" 
              style={{ width: `${actualLimit === Infinity ? 0 : Math.min(100, (usage.requests / actualLimit) * 100)}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-neutral-500">Active API Keys</p>
              <h3 className="text-2xl font-bold mt-1">{keysRes.length}</h3>
            </div>
            <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
              <Key className="w-5 h-5" />
            </div>
          </div>
          <Link href="/developer/keys" className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1">
            Manage Keys <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Platform Resources */}
      <h2 className="text-xl font-bold mb-6">Active Resources</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <Link href="/knowledge" className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm hover:border-violet-500 transition-colors group">
          <div className="flex items-center gap-3 mb-2">
            <Database className="w-5 h-5 text-neutral-400 group-hover:text-violet-500 transition-colors" />
            <h4 className="font-semibold text-neutral-700 dark:text-neutral-300">Knowledge Bases</h4>
          </div>
          <p className="text-3xl font-bold">{kbsRes.length}</p>
        </Link>

        <Link href="/knowledge/databases" className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm hover:border-violet-500 transition-colors group">
          <div className="flex items-center gap-3 mb-2">
            <Server className="w-5 h-5 text-neutral-400 group-hover:text-violet-500 transition-colors" />
            <h4 className="font-semibold text-neutral-700 dark:text-neutral-300">Databases</h4>
          </div>
          <p className="text-3xl font-bold">{dbsRes.length}</p>
        </Link>

        <Link href="/automations" className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm hover:border-violet-500 transition-colors group">
          <div className="flex items-center gap-3 mb-2">
            <Bot className="w-5 h-5 text-neutral-400 group-hover:text-violet-500 transition-colors" />
            <h4 className="font-semibold text-neutral-700 dark:text-neutral-300">Automations</h4>
          </div>
          <p className="text-3xl font-bold">{automationsRes.length}</p>
        </Link>

        <Link href="/mcp" className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm hover:border-violet-500 transition-colors group">
          <div className="flex items-center gap-3 mb-2">
            <Server className="w-5 h-5 text-neutral-400 group-hover:text-violet-500 transition-colors" />
            <h4 className="font-semibold text-neutral-700 dark:text-neutral-300">MCP Servers</h4>
          </div>
          <p className="text-3xl font-bold">{mcpRes.length}</p>
        </Link>

      </div>
    </div>
  );
}
