"use client";

import { useState, useTransition } from "react";
import { Plus, Check, Save, Edit2, CreditCard, RefreshCw, Activity, Users, Globe, Play, Pause, XCircle } from "lucide-react";
import { updatePlan, syncWithPaddle, cancelSubscription, pauseSubscription, resumeSubscription } from "./actions";

export default function BillingClient({ 
  initialPlans, 
  subscriptions, 
  events,
  paddleData
}: { 
  initialPlans: any[], 
  subscriptions: any[], 
  events: any[],
  paddleData: any 
}) {
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'plans' | 'subscriptions' | 'events' | 'paddle' | 'regional'>('overview');
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
      monthlyPrice: parseInt(formData.get("monthlyPrice") as string),
      knowledgeBaseLimit: parseInt(formData.get("knowledgeBaseLimit") as string),
      databaseLimit: parseInt(formData.get("databaseLimit") as string),
      apiAccessEnabled: formData.get("apiAccessEnabled") === "on",
      automationStudioEnabled: formData.get("automationStudioEnabled") === "on",
      mcpEnabled: formData.get("mcpEnabled") === "on",
      paddleProductId: (formData.get("paddleProductId") as string)?.trim() || null,
      paddleMonthlyPriceId: (formData.get("paddleMonthlyPriceId") as string)?.trim() || null,
      paddleYearlyPriceId: (formData.get("paddleYearlyPriceId") as string)?.trim() || null,
    };

    if (editingPlan) {
      await updatePlan(editingPlan.id, data);
      setEditingPlan(null);
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
          <button className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg flex items-center gap-2 font-medium">
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
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-white/10">
            <h3 className="text-sm font-medium text-zinc-500">Total Revenue</h3>
            <p className="text-3xl font-bold mt-2 text-zinc-900 dark:text-white">${(totalRevenue / 100).toFixed(2)}</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-white/10">
            <h3 className="text-sm font-medium text-zinc-500">Active Subscriptions</h3>
            <p className="text-3xl font-bold mt-2 text-zinc-900 dark:text-white">{activeSubsCount}</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-white/10">
            <h3 className="text-sm font-medium text-zinc-500">Paddle Products</h3>
            <p className="text-3xl font-bold mt-2 text-zinc-900 dark:text-white">{paddleData?.products?.length || 0}</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-white/10">
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
          <div key={plan.id} className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl p-6 flex flex-col relative overflow-hidden ${isTeams ? 'opacity-80' : ''}`}>
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
                API Access: {plan.apiAccessEnabled ? 'Yes' : 'No'}
              </li>
            </ul>

            <button 
              onClick={() => setEditingPlan(plan)}
              className="w-full py-2 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-900 dark:text-white rounded-xl border border-zinc-200 dark:border-white/10 font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Edit2 className="w-4 h-4" /> Edit Configuration
            </button>
          </div>
        )})}
      </div>
      )}

      {activeTab === 'subscriptions' && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-zinc-50 dark:bg-white/5 border-b border-zinc-200 dark:border-white/10 text-sm text-zinc-500">
              <tr>
                <th className="p-4 font-medium">Customer</th>
                <th className="p-4 font-medium">Plan</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Paddle IDs</th>
                <th className="p-4 font-medium">Renewal</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-white/10">
              {subscriptions.map(sub => {
                const plan = initialPlans.find(p => p.id === sub.planId);
                return (
                  <tr key={sub.id} className="text-sm">
                    <td className="p-4">
                      <div className="font-medium text-zinc-900 dark:text-white">{sub.user?.fullName}</div>
                      <div className="text-zinc-500 text-xs">{sub.user?.email}</div>
                    </td>
                    <td className="p-4 text-zinc-700 dark:text-zinc-300">{plan?.name || 'Unknown'} <span className="text-xs text-zinc-400 capitalize">({sub.billingCycle})</span></td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${sub.status === 'active' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : sub.status === 'paused' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'}`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="text-xs text-zinc-500 font-mono" title="Customer ID">{sub.paddleCustomerId || '-'}</div>
                      <div className="text-xs text-zinc-500 font-mono" title="Subscription ID">{sub.paddleSubscriptionId || '-'}</div>
                    </td>
                    <td className="p-4 text-zinc-500">
                      {sub.renewsAt ? new Date(sub.renewsAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="p-4 text-right">
                      {sub.paddleSubscriptionId && sub.status !== 'canceled' && (
                        <div className="flex justify-end gap-2">
                          {sub.status === 'active' && (
                            <button onClick={() => handleSubAction('pause', sub.paddleSubscriptionId)} className="p-1.5 text-zinc-500 hover:text-amber-500 bg-zinc-100 dark:bg-zinc-800 rounded-md" title="Pause">
                              <Pause className="w-4 h-4" />
                            </button>
                          )}
                          {sub.status === 'paused' && (
                            <button onClick={() => handleSubAction('resume', sub.paddleSubscriptionId)} className="p-1.5 text-zinc-500 hover:text-emerald-500 bg-zinc-100 dark:bg-zinc-800 rounded-md" title="Resume">
                              <Play className="w-4 h-4" />
                            </button>
                          )}
                          <button onClick={() => handleSubAction('cancel', sub.paddleSubscriptionId)} className="p-1.5 text-zinc-500 hover:text-rose-500 bg-zinc-100 dark:bg-zinc-800 rounded-md" title="Cancel">
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {subscriptions.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-500">No subscriptions found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'events' && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl overflow-hidden">
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
            <div className="p-6 text-center border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-900">
              <p className="text-zinc-500">Paddle data is not available. Please ensure your API key is correctly configured.</p>
            </div>
          )}

          {paddleData?.webhooks && paddleData.webhooks.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl overflow-hidden p-6">
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
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl overflow-hidden p-6">
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
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'regional' && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900">
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
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">Edit {editingPlan.name} Plan</h2>
            
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">Plan Name</label>
                  <input name="name" type="text" defaultValue={editingPlan.name} className="w-full bg-transparent border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-2 text-zinc-900 dark:text-white" />
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
                    <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">Yearly Price ID</label>
                    <input name="paddleYearlyPriceId" type="text" defaultValue={editingPlan.paddleYearlyPriceId || ''} className="w-full bg-transparent border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-2 text-zinc-900 dark:text-white font-mono text-xs" placeholder="pri_..." />
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
                </div>
              </div>

              <div>
                <h3 className="text-zinc-900 dark:text-white font-medium mb-3 border-b border-zinc-200 dark:border-white/10 pb-2">Features</h3>
                <div className="space-y-2">
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
    </div>
  );
}
