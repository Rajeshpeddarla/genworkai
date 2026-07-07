"use client";

import { useState, useTransition } from "react";
import { Plus, Check, Save, Edit2, CreditCard, RefreshCw, Activity, Users, Globe, Play, Pause, XCircle, Settings, Trash2 } from "lucide-react";
import { updatePlan, createPlan, syncWithPaddle, cancelSubscription, pauseSubscription, resumeSubscription, createCreditPack, updateCreditPack, updateCreditCost, deletePlan } from "./actions";
import { CostSimulatorDashboard } from "./CostSimulatorDashboard";

interface Props {
  initialPlans: any[];
  subscriptions: any[];
  events: any[];
  paddleData: any;
  initialPacks?: any[];
  userBalances?: any[];
  initialCosts?: any[];
  initialProviderCosts?: any;
}

export default function BillingClient({ 
  initialPlans, 
  subscriptions, 
  events,
  paddleData,
  initialPacks,
  userBalances,
  initialCosts,
  initialProviderCosts
}: Props) {
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [editingPack, setEditingPack] = useState<any | null>(null);
  const [editingCost, setEditingCost] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'plans' | 'packs' | 'costs' | 'simulator' | 'balances' | 'subscriptions' | 'events' | 'paddle' | 'regional'>('overview');
  const [isSyncing, startSync] = useTransition();

  const handleSync = () => {
    startSync(() => {
      syncWithPaddle();
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      name: formData.get("name") as string,
      slug: (formData.get("slug") as string) || (formData.get("name") as string).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
      monthlyPrice: parseInt(formData.get("monthlyPrice") as string),
      knowledgeBaseLimit: parseInt(formData.get("knowledgeBaseLimit") as string) || 0,
      databaseLimit: parseInt(formData.get("databaseLimit") as string) || 0,
      mcpServerLimit: parseInt(formData.get("mcpServerLimit") as string) || 0,
      automationLimit: parseInt(formData.get("automationLimit") as string) || 0,
      contextLimit: Math.round((parseFloat(formData.get("contextLimit") as string) || 0) * 1048576),
      apiRequestLimit: parseInt(formData.get("apiRequestLimit") as string) || 0,
      mcpRequestLimit: parseInt(formData.get("mcpRequestLimit") as string) || 0,
      mcpToolLimit: parseInt(formData.get("mcpToolLimit") as string) || 0,
      concurrencyLimit: parseInt(formData.get("concurrencyLimit") as string) || 0,
      rateLimit: parseInt(formData.get("rateLimit") as string) || 0,
      workspaceLimit: parseInt(formData.get("workspaceLimit") as string) || 0,
      apiKeyLimit: parseInt(formData.get("apiKeyLimit") as string) || 0,
      knowledgeBaseEnabled: formData.get("knowledgeBaseEnabled") === "on",
      databaseIntelligenceEnabled: formData.get("databaseIntelligenceEnabled") === "on",
      apiAccessEnabled: formData.get("apiAccessEnabled") === "on",
      automationStudioEnabled: formData.get("automationStudioEnabled") === "on",
      mcpEnabled: formData.get("mcpEnabled") === "on",
      byokEnabled: formData.get("byokEnabled") === "on",
      prioritySupportEnabled: formData.get("prioritySupportEnabled") === "on",
      paddleProductId: (formData.get("paddleProductId") as string)?.trim() || null,
      paddleMonthlyPriceId: (formData.get("paddleMonthlyPriceId") as string)?.trim() || null,
      paddleYearlyPriceId: (formData.get("paddleYearlyPriceId") as string)?.trim() || null,
      monthlyAiCredits: parseInt(formData.get("monthlyAiCredits") as string) || 0,
    };

    if (editingPlan) {
      if (editingPlan.id) {
        await updatePlan(editingPlan.id, data);
      } else {
        await import('./actions').then(m => m.createPlan(data));
      }
      setEditingPlan(null);
    }
  };

  const handleSavePack = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      name: formData.get("name") as string,
      priceCents: parseInt(formData.get("priceCents") as string),
      credits: parseInt(formData.get("credits") as string),
      paddleProductId: (formData.get("paddleProductId") as string)?.trim() || null,
      paddlePriceId: (formData.get("paddlePriceId") as string)?.trim() || null,
      isActive: formData.get("isActive") === "on",
      displayOrder: parseInt(formData.get("displayOrder") as string) || 0,
    };

    if (editingPack?.id) {
      await updateCreditPack(editingPack.id, data);
    } else {
      await createCreditPack(data);
    }
    setEditingPack(null);
  };

  const handleCostSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const creditCost = parseInt(formData.get("creditCost") as string);
    if (editingCost?.operationKey) {
      await updateCreditCost(editingCost.operationKey, creditCost);
    }
    setEditingCost(null);
  };

  const handleDeletePlan = async (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete the plan "${name}"? This action cannot be undone.`)) {
      await deletePlan(id);
    }
  };

  const handleSubAction = async (action: 'cancel' | 'pause' | 'resume', subId: string) => {
    if (!subId) return;
    if (action === 'cancel') {
      if (confirm("Are you sure you want to cancel this subscription?")) {
        await cancelSubscription(subId);
      }
    } else if (action === 'pause') {
      await pauseSubscription(subId);
    } else if (action === 'resume') {
      await resumeSubscription(subId);
    }
  };

  // Group prices by product
  const pricesByProduct: Record<string, any[]> = {};
  if (paddleData?.prices) {
    paddleData.prices.forEach((p: any) => {
      if (!pricesByProduct[p.productId]) {
        pricesByProduct[p.productId] = [];
      }
      pricesByProduct[p.productId]!.push(p);
    });
  }

  // Calculate Overview Stats
  const activeSubsCount = subscriptions.filter(s => s.status === 'active' || s.status === 'trialing').length;
  const totalRevenue = events.reduce((acc, ev) => acc + ev.amount, 0);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Billing Studio</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">The GenWorkAI Billing Operating System.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleSync}
            disabled={isSyncing}
            className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50 text-zinc-900 dark:text-white rounded-lg flex items-center gap-2 font-medium transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} /> 
            {isSyncing ? 'Syncing...' : 'Sync with Paddle'}
          </button>
          <button 
            onClick={() => setEditingPlan({})}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg flex items-center gap-2 font-medium"
          >
            <Plus className="w-4 h-4" /> Create Plan
          </button>
        </div>
      </div>

      <div className="flex border-b border-zinc-200 dark:border-white/10 mb-6 overflow-x-auto">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-4 font-medium text-sm transition-colors relative whitespace-nowrap ${activeTab === 'overview' ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
        >
          <div className="flex items-center gap-2"><Activity className="w-4 h-4" /> Overview</div>
          {activeTab === 'overview' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-500" />}
        </button>
        <button 
          onClick={() => setActiveTab('plans')}
          className={`pb-3 px-4 font-medium text-sm transition-colors relative whitespace-nowrap ${activeTab === 'plans' ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
        >
          <div className="flex items-center gap-2"><CreditCard className="w-4 h-4" /> Local Plans</div>
          {activeTab === 'plans' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-500" />}
        </button>
        <button 
          onClick={() => setActiveTab('packs')}
          className={`pb-3 px-4 font-medium text-sm transition-colors relative whitespace-nowrap ${activeTab === 'packs' ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
        >
          <div className="flex items-center gap-2"><CreditCard className="w-4 h-4" /> AI Credit Packs</div>
          {activeTab === 'packs' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-500" />}
        </button>
        <button 
          onClick={() => setActiveTab('costs')}
          className={`pb-3 px-4 font-medium text-sm transition-colors relative whitespace-nowrap ${activeTab === 'costs' ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
        >
          <div className="flex items-center gap-2"><Settings className="w-4 h-4" /> Credit Costs</div>
          {activeTab === 'costs' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-500" />}
        </button>
        <button 
          onClick={() => setActiveTab('simulator')}
          className={`pb-3 px-4 font-medium text-sm transition-colors relative whitespace-nowrap ${activeTab === 'simulator' ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
        >
          <div className="flex items-center gap-2"><Activity className="w-4 h-4" /> AI Simulator</div>
          {activeTab === 'simulator' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-500" />}
        </button>
        <button 
          onClick={() => setActiveTab('balances')}
          className={`pb-3 px-4 font-medium text-sm transition-colors relative whitespace-nowrap ${activeTab === 'balances' ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
        >
          <div className="flex items-center gap-2"><Users className="w-4 h-4" /> User Balances</div>
          {activeTab === 'balances' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-500" />}
        </button>
        <button 
          onClick={() => setActiveTab('subscriptions')}
          className={`pb-3 px-4 font-medium text-sm transition-colors relative whitespace-nowrap ${activeTab === 'subscriptions' ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
        >
          <div className="flex items-center gap-2"><Users className="w-4 h-4" /> Customers</div>
          {activeTab === 'subscriptions' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-500" />}
        </button>
        <button 
          onClick={() => setActiveTab('events')}
          className={`pb-3 px-4 font-medium text-sm transition-colors relative whitespace-nowrap ${activeTab === 'events' ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
        >
          <div className="flex items-center gap-2"><Activity className="w-4 h-4" /> Billing Events</div>
          {activeTab === 'events' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-500" />}
        </button>
        <button 
          onClick={() => setActiveTab('paddle')}
          className={`pb-3 px-4 font-medium text-sm transition-colors relative whitespace-nowrap ${activeTab === 'paddle' ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
        >
          <div className="flex items-center gap-2"><Globe className="w-4 h-4" /> Paddle Overview</div>
          {activeTab === 'paddle' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-500" />}
        </button>
        <button 
          onClick={() => setActiveTab('regional')}
          className={`pb-3 px-4 font-medium text-sm transition-colors relative whitespace-nowrap ${activeTab === 'regional' ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
        >
          <div className="flex items-center gap-2"><Globe className="w-4 h-4" /> Regional Pricing</div>
          {activeTab === 'regional' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-500" />}
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-card p-6 rounded-2xl border border-zinc-200 dark:border-white/10">
            <h3 className="text-sm font-medium text-zinc-500">Total Revenue</h3>
            <p className="text-3xl font-bold mt-2 text-zinc-900 dark:text-white">${(totalRevenue / 100).toFixed(2)}</p>
          </div>
          <div className="bg-white dark:bg-card p-6 rounded-2xl border border-zinc-200 dark:border-white/10">
            <h3 className="text-sm font-medium text-zinc-500">Active Subscriptions</h3>
            <p className="text-3xl font-bold mt-2 text-zinc-900 dark:text-white">{activeSubsCount}</p>
          </div>
          <div className="bg-white dark:bg-card p-6 rounded-2xl border border-zinc-200 dark:border-white/10">
            <h3 className="text-sm font-medium text-zinc-500">Paddle Products</h3>
            <p className="text-3xl font-bold mt-2 text-zinc-900 dark:text-white">{paddleData?.products?.length || 0}</p>
          </div>
          <div className="bg-white dark:bg-card p-6 rounded-2xl border border-zinc-200 dark:border-white/10">
            <h3 className="text-sm font-medium text-zinc-500">Webhooks Configured</h3>
            <p className="text-3xl font-bold mt-2 text-zinc-900 dark:text-white">{paddleData?.webhooks?.length || 0}</p>
          </div>
        </div>
      )}

      {activeTab === 'plans' && (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {initialPlans.map(plan => {
          const isTeams = plan.slug.toLowerCase().includes('team');
          return (
          <div key={plan.id} className={`bg-white dark:bg-card border border-zinc-200 dark:border-white/10 rounded-2xl p-6 flex flex-col relative overflow-hidden ${isTeams ? 'opacity-80' : ''}`}>
            {isTeams && (
              <div className="absolute top-4 right-4 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                Internal Testing
              </div>
            )}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  {plan.name}
                  {isTeams && <span className="text-xs bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded-full">Coming Soon</span>}
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 font-mono">/{plan.slug}</p>
              </div>
            </div>
            
            <div className="my-4">
              <span className="text-3xl font-bold text-zinc-900 dark:text-white">${plan.monthlyPrice / 100}</span>
              <span className="text-zinc-500">/mo</span>
            </div>

            <ul className="space-y-3 mb-6 flex-1 text-sm text-zinc-600 dark:text-zinc-300">
                <li className="flex gap-2 items-center">
                  <Check className="w-4 h-4 text-rose-500" />
                  {plan.knowledgeBaseLimit} Knowledge Bases
                </li>
                <li className="flex gap-2 items-center">
                  <Check className="w-4 h-4 text-rose-500" />
                  {plan.databaseLimit} DB Connections
                </li>
                <li className="flex gap-2 items-center">
                  <Check className="w-4 h-4 text-rose-500" />
                  {plan.mcpServerLimit} MCP Servers
                </li>
                <li className="flex gap-2 items-center">
                  <Check className="w-4 h-4 text-rose-500" />
                  {plan.automationLimit} Automations
                </li>
                <li className="flex gap-2 items-center">
                  <Check className="w-4 h-4 text-emerald-500" />
                  {plan.monthlyAiCredits} Monthly AI Credits
                </li>
              <li className="flex gap-2 items-center">
                <Check className="w-4 h-4 text-rose-500" />
                API Access: {plan.apiAccessEnabled ? 'Yes' : 'No'}
              </li>
            </ul>

            <div className="flex gap-2">
              <button 
                onClick={() => setEditingPlan(plan)}
                className="flex-1 py-2 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-900 dark:text-white rounded-xl border border-zinc-200 dark:border-white/10 font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Edit2 className="w-4 h-4" /> Edit Configuration
              </button>
              <button 
                onClick={() => handleDeletePlan(plan.id, plan.name)}
                className="px-3 py-2 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-100 dark:border-rose-500/20 font-medium transition-colors flex items-center justify-center"
                title="Delete Plan"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )})}
      </div>
      )}

      {activeTab === 'subscriptions' && (
        <div className="bg-white dark:bg-card rounded-2xl border border-zinc-200 dark:border-white/10 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400">
              <tr>
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium">Plan</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Billing Cycle</th>
                <th className="px-6 py-4 font-medium">Created</th>
                <th className="px-6 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-white/10">
              {subscriptions.map((sub) => {
                const plan = initialPlans.find(p => p.id === sub.planId);
                return (
                  <tr key={sub.id} className="hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-zinc-900 dark:text-white">{sub.user?.fullName || 'Unknown User'}</div>
                      <div className="text-xs text-zinc-500">{sub.user?.email || ''}</div>
                    </td>
                    <td className="px-6 py-4 font-medium capitalize">{plan?.name || 'Unknown Plan'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                        sub.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        sub.status === 'trialing' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        sub.status === 'paused' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
                      }`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 capitalize">{sub.billingCycle}</td>
                    <td className="px-6 py-4 text-zinc-500">
                      {new Date(sub.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {sub.status === 'active' && (
                          <>
                            <button 
                              onClick={() => handleSubAction('pause', sub.id)}
                              className="p-2 text-zinc-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-colors"
                              title="Pause Subscription"
                            >
                              <Pause className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleSubAction('cancel', sub.id)}
                              className="p-2 text-zinc-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                              title="Cancel Subscription"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {sub.status === 'paused' && (
                          <button 
                            onClick={() => handleSubAction('resume', sub.id)}
                            className="p-2 text-zinc-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
                            title="Resume Subscription"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {subscriptions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                    No active subscriptions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'packs' && (
        <div className="bg-white dark:bg-card rounded-2xl border border-zinc-200 dark:border-white/10 overflow-hidden">
          <div className="p-4 border-b border-zinc-200 dark:border-white/10 flex justify-end">
            <button 
              onClick={() => setEditingPack({})}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg flex items-center gap-2 font-medium text-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> Create Pack
            </button>
          </div>
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400">
              <tr>
                <th className="px-6 py-4 font-medium">Pack Name</th>
                <th className="px-6 py-4 font-medium">Price</th>
                <th className="px-6 py-4 font-medium">API Requests</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-white/10">
              {(initialPacks || []).map((pack) => (
                <tr key={pack.id} className="hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-medium">{pack.name}</td>
                  <td className="px-6 py-4">${(pack.priceCents / 100).toFixed(2)}</td>
                  <td className="px-6 py-4 font-medium text-emerald-600">{pack.credits.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                      pack.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
                    }`}>
                      {pack.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => setEditingPack(pack)} className="text-indigo-600 hover:text-indigo-800 font-medium text-sm">Edit</button>
                  </td>
                </tr>
              ))}
              {(!initialPacks || initialPacks.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                    No AI credit packs configured.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {/* Costs Tab */}
      {activeTab === 'costs' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-white dark:bg-card border border-zinc-200 dark:border-white/10 rounded-xl overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-50 dark:bg-white/5 border-b border-zinc-200 dark:border-white/10">
                <tr>
                  <th className="px-6 py-3 font-semibold text-zinc-500">Operation Key</th>
                  <th className="px-6 py-3 font-semibold text-zinc-500">Description</th>
                  <th className="px-6 py-3 font-semibold text-zinc-500">Cost (Credits)</th>
                  <th className="px-6 py-3 font-semibold text-zinc-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-white/10">
                {initialCosts?.map((cost) => (
                  <tr key={cost.operationKey} className="hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium font-mono text-xs">{cost.operationKey}</td>
                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">{cost.description}</td>
                    <td className="px-6 py-4 font-medium text-emerald-600">{cost.creditCost}</td>
                    <td className="px-6 py-4">
                      <button onClick={() => setEditingCost(cost)} className="p-2 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'simulator' && (
        <CostSimulatorDashboard 
          initialCosts={initialCosts || []} 
          initialProviderCosts={initialProviderCosts} 
        />
      )}

      {activeTab === 'balances' && (
        <div className="bg-white dark:bg-card rounded-2xl border border-zinc-200 dark:border-white/10 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400">
              <tr>
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium text-right">Monthly Remaining</th>
                <th className="px-6 py-4 font-medium text-right">Purchased Remaining</th>
                <th className="px-6 py-4 font-medium text-right">Total Available</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-white/10">
              {userBalances?.map((balance: any) => {
                const total = (balance.monthlyRemainingCredits || 0) + (balance.purchasedRemainingCredits || 0);
                return (
                  <tr key={balance.userId} className="hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-zinc-900 dark:text-white">{balance.user?.fullName || 'Unknown'}</div>
                      <div className="text-xs text-zinc-500">{balance.user?.email}</div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium">{balance.monthlyRemainingCredits?.toLocaleString() || 0}</td>
                    <td className="px-6 py-4 text-right font-medium text-indigo-600 dark:text-indigo-400">{balance.purchasedRemainingCredits?.toLocaleString() || 0}</td>
                    <td className="px-6 py-4 text-right font-bold text-emerald-600">{total.toLocaleString()}</td>
                  </tr>
                );
              })}
              {(!userBalances || userBalances.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">
                    No user balances found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'events' && (
        <div className="bg-white dark:bg-card border border-zinc-200 dark:border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-zinc-50 dark:bg-white/5 border-b border-zinc-200 dark:border-white/10 text-sm text-zinc-500">
              <tr>
                <th className="p-4 font-medium">Type</th>
                <th className="p-4 font-medium">Amount</th>
                <th className="p-4 font-medium text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-white/10">
              {events.map(event => (
                <tr key={event.id} className="text-sm">
                  <td className="p-4">
                    <div className="font-medium text-zinc-900 dark:text-white">{event.eventType}</div>
                    <div className="text-zinc-500 text-xs font-mono">{event.paddleTransactionId}</div>
                  </td>
                  <td className="p-4 font-medium text-emerald-600 dark:text-emerald-400">
                    ${(event.amount / 100).toFixed(2)} {event.currency}
                  </td>
                  <td className="p-4 text-right text-zinc-500">
                    {event.createdAt ? new Date(event.createdAt).toLocaleString() : '-'}
                  </td>
                </tr>
              ))}
              {events.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-zinc-500">No billing events recorded</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'paddle' && (
        <div className="space-y-6">
          {!paddleData && (
            <div className="p-6 text-center border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-card">
              <p className="text-zinc-500">Paddle data is not available. Please ensure your API key is correctly configured.</p>
            </div>
          )}

          {paddleData?.webhooks && paddleData.webhooks.length > 0 && (
            <div className="bg-white dark:bg-card border border-zinc-200 dark:border-white/10 rounded-2xl overflow-hidden p-6">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Webhooks</h2>
              <div className="space-y-4">
                {paddleData.webhooks.map((wh: any) => (
                  <div key={wh.id} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-white/5">
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-white">{wh.description || 'Webhook Endpoint'}</p>
                      <p className="text-sm text-zinc-500 font-mono mt-1">{wh.endpoint}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${wh.active ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-zinc-500/20 text-zinc-600 dark:text-zinc-400'}`}>
                      {wh.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {paddleData?.products && paddleData.products.length > 0 && (
            <div className="bg-white dark:bg-card border border-zinc-200 dark:border-white/10 rounded-2xl overflow-hidden p-6">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Products ({paddleData.products.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paddleData.products.map((prod: any) => (
                  <div key={prod.id} className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-white/5">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-zinc-900 dark:text-white">{prod.name}</p>
                        <p className="text-xs text-zinc-500 font-mono mt-1">{prod.id}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${prod.status === 'active' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-zinc-500/20 text-zinc-600 dark:text-zinc-400'}`}>
                        {prod.status}
                      </span>
                    </div>
                    <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-white/5 flex justify-end">
                      <button 
                        onClick={() => {
                          const monthlyPrice = pricesByProduct[prod.id]?.find((p: any) => p.billingCycle?.interval === 'month');
                          const yearlyPrice = pricesByProduct[prod.id]?.find((p: any) => p.billingCycle?.interval === 'year');
                          
                          setEditingPlan({
                            name: prod.name,
                            slug: prod.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
                            paddleProductId: prod.id,
                            paddleMonthlyPriceId: monthlyPrice?.id || '',
                            paddleYearlyPriceId: yearlyPrice?.id || '',
                            monthlyPrice: monthlyPrice ? parseInt(monthlyPrice.unitPrice?.amount || '0') : 0,
                            yearlyPrice: yearlyPrice ? parseInt(yearlyPrice.unitPrice?.amount || '0') : 0,
                            // Default limits to 0
                            knowledgeBaseLimit: 0,
                            databaseLimit: 0,
                            mcpServerLimit: 0,
                            automationLimit: 0,
                            monthlyAiCredits: 0
                          });
                          setActiveTab('plans');
                        }}
                        className="px-3 py-1.5 text-xs font-medium bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 dark:text-rose-400 rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" /> Import as Plan
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'regional' && (
        <div className="bg-white dark:bg-card border border-zinc-200 dark:border-white/10 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-card">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Regional Pricing Overview</h2>
            <p className="text-sm text-zinc-500 mt-1">READ ONLY. All price overrides are managed in the Paddle Dashboard.</p>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-100 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-white/10 text-zinc-500">
              <tr>
                <th className="p-4 font-medium">Product</th>
                <th className="p-4 font-medium">Currency</th>
                <th className="p-4 font-medium">Unit Price</th>
                <th className="p-4 font-medium">Billing Cycle</th>
                <th className="p-4 font-medium">Price ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-white/10">
              {paddleData?.prices?.map((price: any) => {
                const product = paddleData.products?.find((p: any) => p.id === price.productId);
                return (
                  <tr key={price.id}>
                    <td className="p-4 font-medium text-zinc-900 dark:text-white">
                      {product?.name || price.productId}
                    </td>
                    <td className="p-4 text-zinc-600 dark:text-zinc-400">{price.unitPrice?.currencyCode}</td>
                    <td className="p-4 font-medium text-zinc-900 dark:text-white">
                      {(parseInt(price.unitPrice?.amount || '0') / 100).toFixed(2)}
                    </td>
                    <td className="p-4 text-zinc-600 dark:text-zinc-400 capitalize">
                      {price.billingCycle ? `${price.billingCycle.interval}ly` : 'One-time'}
                    </td>
                    <td className="p-4 text-xs font-mono text-zinc-500">
                      {price.id}
                    </td>
                  </tr>
                );
              })}
              {(!paddleData?.prices || paddleData.prices.length === 0) && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-500">No regional pricing data found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {editingPlan && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-card border border-zinc-200 dark:border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">Edit {editingPlan.name} Plan</h2>
            
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">Plan Name</label>
                  <input name="name" type="text" defaultValue={editingPlan.name} className="w-full bg-transparent border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-2 text-zinc-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">Slug</label>
                  <input name="slug" type="text" defaultValue={editingPlan.slug} className="w-full bg-transparent border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-2 text-zinc-900 dark:text-white" placeholder="free" />
                </div>
                <div>
                  <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">Monthly Price (Cents)</label>
                  <input name="monthlyPrice" type="number" defaultValue={editingPlan.monthlyPrice} className="w-full bg-transparent border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-2 text-zinc-900 dark:text-white" />
                </div>
              </div>

              <div>
                <h3 className="text-zinc-900 dark:text-white font-medium mb-3 border-b border-zinc-200 dark:border-white/10 pb-2">Paddle Integration</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">Paddle Product ID</label>
                    <input name="paddleProductId" type="text" defaultValue={editingPlan.paddleProductId || ''} className="w-full bg-transparent border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-2 text-zinc-900 dark:text-white font-mono text-xs" placeholder="pro_..." />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">Monthly Price ID</label>
                    <input name="paddleMonthlyPriceId" type="text" defaultValue={editingPlan.paddleMonthlyPriceId || ''} className="w-full bg-transparent border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-2 text-zinc-900 dark:text-white font-mono text-xs" placeholder="pri_..." />
                  </div>
                  <div>

                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-zinc-900 dark:text-white font-medium mb-3 border-b border-zinc-200 dark:border-white/10 pb-2">Limits</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">KB Limit</label>
                    <input name="knowledgeBaseLimit" type="number" defaultValue={editingPlan.knowledgeBaseLimit} className="w-full bg-transparent border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-2 text-zinc-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">DB Connection Limit</label>
                    <input name="databaseLimit" type="number" defaultValue={editingPlan.databaseLimit} className="w-full bg-transparent border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-2 text-zinc-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">MCP Server Limit</label>
                    <input name="mcpServerLimit" type="number" defaultValue={editingPlan.mcpServerLimit} className="w-full bg-transparent border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-2 text-zinc-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">Automation Limit</label>
                    <input name="automationLimit" type="number" defaultValue={editingPlan.automationLimit} className="w-full bg-transparent border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-2 text-zinc-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">Monthly AI Credits</label>
                    <input name="monthlyAiCredits" type="number" defaultValue={editingPlan.monthlyAiCredits} className="w-full bg-transparent border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-2 text-zinc-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">Context Limit (MB)</label>
                    <input name="contextLimit" type="number" step="any" defaultValue={editingPlan.contextLimit ? editingPlan.contextLimit / 1048576 : 0} className="w-full bg-transparent border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-2 text-zinc-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">API Request Limit</label>
                    <input name="apiRequestLimit" type="number" defaultValue={editingPlan.apiRequestLimit} className="w-full bg-transparent border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-2 text-zinc-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">Concurrency Limit (req/sec)</label>
                    <input name="concurrencyLimit" type="number" defaultValue={editingPlan.concurrencyLimit} className="w-full bg-transparent border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-2 text-zinc-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">Rate Limit (req/min)</label>
                    <input name="rateLimit" type="number" defaultValue={editingPlan.rateLimit} className="w-full bg-transparent border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-2 text-zinc-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">MCP Request Limit</label>
                    <input name="mcpRequestLimit" type="number" defaultValue={editingPlan.mcpRequestLimit} className="w-full bg-transparent border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-2 text-zinc-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">MCP Tool Limit</label>
                    <input name="mcpToolLimit" type="number" defaultValue={editingPlan.mcpToolLimit} className="w-full bg-transparent border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-2 text-zinc-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">API Key Limit</label>
                    <input name="apiKeyLimit" type="number" defaultValue={editingPlan.apiKeyLimit} className="w-full bg-transparent border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-2 text-zinc-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">Workspace Limit</label>
                    <input name="workspaceLimit" type="number" defaultValue={editingPlan.workspaceLimit} className="w-full bg-transparent border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-2 text-zinc-900 dark:text-white" />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-zinc-900 dark:text-white font-medium mb-3 border-b border-zinc-200 dark:border-white/10 pb-2">Features</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-3">
                    <input name="knowledgeBaseEnabled" type="checkbox" defaultChecked={editingPlan.knowledgeBaseEnabled} className="w-4 h-4 accent-rose-500" />
                    <span className="text-zinc-700 dark:text-zinc-300">Knowledge Base Enabled</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input name="databaseIntelligenceEnabled" type="checkbox" defaultChecked={editingPlan.databaseIntelligenceEnabled} className="w-4 h-4 accent-rose-500" />
                    <span className="text-zinc-700 dark:text-zinc-300">Database Intelligence Enabled</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input name="apiAccessEnabled" type="checkbox" defaultChecked={editingPlan.apiAccessEnabled} className="w-4 h-4 accent-rose-500" />
                    <span className="text-zinc-700 dark:text-zinc-300">API Access Enabled</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input name="automationStudioEnabled" type="checkbox" defaultChecked={editingPlan.automationStudioEnabled} className="w-4 h-4 accent-rose-500" />
                    <span className="text-zinc-700 dark:text-zinc-300">Automation Studio Enabled</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input name="mcpEnabled" type="checkbox" defaultChecked={editingPlan.mcpEnabled} className="w-4 h-4 accent-rose-500" />
                    <span className="text-zinc-700 dark:text-zinc-300">MCP Enabled</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input name="byokEnabled" type="checkbox" defaultChecked={editingPlan.byokEnabled} className="w-4 h-4 accent-rose-500" />
                    <span className="text-zinc-700 dark:text-zinc-300">BYOK Enabled</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input name="prioritySupportEnabled" type="checkbox" defaultChecked={editingPlan.prioritySupportEnabled} className="w-4 h-4 accent-rose-500" />
                    <span className="text-zinc-700 dark:text-zinc-300">Priority Support Enabled</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-zinc-200 dark:border-white/10">
                <button type="button" onClick={() => setEditingPlan(null)} className="px-4 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium flex items-center gap-2">
                  <Save className="w-4 h-4" /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* AI Credit Pack Editor Modal */}
      {editingPack && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-card rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-zinc-200 dark:border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                {editingPack.id ? `Edit Pack: ${editingPack.name}` : 'Create AI Credit Pack'}
              </h2>
              <button 
                onClick={() => setEditingPack(null)}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-500 transition-colors"
              >
                Cancel
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="packForm" onSubmit={handleSavePack} className="space-y-8">
                <div>
                  <h3 className="text-zinc-900 dark:text-white font-medium mb-3 border-b border-zinc-200 dark:border-white/10 pb-2">Basic Info</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">Name</label>
                      <input name="name" defaultValue={editingPack.name} className="w-full bg-transparent border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-2 text-zinc-900 dark:text-white" required />
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">Price (Cents)</label>
                      <input name="priceCents" type="number" defaultValue={editingPack.priceCents || 0} className="w-full bg-transparent border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-2 text-zinc-900 dark:text-white" required />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">AI Credits Provided</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <input name="credits" type="number" defaultValue={editingPack.credits || 0} className="w-full bg-transparent border border-zinc-200 dark:border-white/10 rounded-lg pl-10 pr-4 py-2 text-zinc-900 dark:text-white" required />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">Display Order</label>
                      <input name="displayOrder" type="number" defaultValue={editingPack.displayOrder || 0} className="w-full bg-transparent border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-2 text-zinc-900 dark:text-white" />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-zinc-900 dark:text-white font-medium mb-3 border-b border-zinc-200 dark:border-white/10 pb-2">Paddle Configuration</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">Product ID</label>
                      <input name="paddleProductId" defaultValue={editingPack.paddleProductId} className="w-full bg-transparent border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-2 text-zinc-900 dark:text-white font-mono text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">Price ID</label>
                      <input name="paddlePriceId" defaultValue={editingPack.paddlePriceId} className="w-full bg-transparent border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-2 text-zinc-900 dark:text-white font-mono text-sm" />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-zinc-900 dark:text-white font-medium mb-3 border-b border-zinc-200 dark:border-white/10 pb-2">Status</h3>
                  <label className="flex items-center gap-3">
                    <input type="checkbox" name="isActive" defaultChecked={editingPack.isActive !== false} className="w-4 h-4 rounded border-zinc-300 text-rose-600 focus:ring-rose-600" />
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">Is Active</span>
                  </label>
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800/50 flex justify-end gap-3">
              <button 
                onClick={() => setEditingPack(null)}
                className="px-4 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white font-medium"
              >
                Cancel
              </button>
              <button 
                type="submit"
                form="packForm"
                className="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
              >
                <Save className="w-4 h-4" /> Save Pack
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credit Cost Editor Modal */}
      {editingCost && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-card rounded-2xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-zinc-200 dark:border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                Edit Cost: {editingCost.operationKey}
              </h2>
              <button 
                onClick={() => setEditingCost(null)}
                className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              >
                Cancel
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="cost-form" onSubmit={handleCostSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">Description</label>
                  <p className="text-sm font-medium">{editingCost.description}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Cost (Credits)</label>
                  <input name="creditCost" type="number" defaultValue={editingCost.creditCost || 0} className="w-full bg-transparent border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-2 text-zinc-900 dark:text-white" required />
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-zinc-200 dark:border-white/10 flex justify-end">
              <button 
                type="submit"
                form="cost-form"
                className="bg-card hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
