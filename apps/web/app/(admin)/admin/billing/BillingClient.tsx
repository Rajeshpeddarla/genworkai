"use client";

import { useState } from "react";
import { Plus, Check, Save, Edit2 } from "lucide-react";
import { updatePlan } from "./actions";

export default function BillingClient({ initialPlans }: { initialPlans: any[] }) {
  const [editingPlan, setEditingPlan] = useState<any | null>(null);

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
    };

    if (editingPlan) {
      await updatePlan(editingPlan.id, data);
      setEditingPlan(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Billing Studio</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Manage subscription plans, limits, and feature toggles.</p>
        </div>
        <button className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg flex items-center gap-2 font-medium">
          <Plus className="w-4 h-4" /> Create Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {initialPlans.map(plan => (
          <div key={plan.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl p-6 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{plan.name}</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 font-mono">/{plan.slug}</p>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${plan.isActive ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-zinc-500/20 text-zinc-600 dark:text-zinc-400'}`}>
                {plan.isActive ? 'Active' : 'Draft'}
              </span>
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
              <li className="flex gap-2 items-center">
                <Check className="w-4 h-4 text-rose-500" />
                Automation: {plan.automationStudioEnabled ? 'Yes' : 'No'}
              </li>
              <li className="flex gap-2 items-center">
                <Check className="w-4 h-4 text-rose-500" />
                MCP: {plan.mcpEnabled ? 'Yes' : 'No'}
              </li>
            </ul>

            <button 
              onClick={() => setEditingPlan(plan)}
              className="w-full py-2 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-900 dark:text-white rounded-xl border border-zinc-200 dark:border-white/10 font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Edit2 className="w-4 h-4" /> Edit Configuration
            </button>
          </div>
        ))}
      </div>

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
