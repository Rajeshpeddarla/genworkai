"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Loader2, Plus, Edit2, CheckCircle2, XCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminPlans() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState<any>(null); // Plan object being edited/created
  const [saving, setSaving] = useState(false);

  const [syncing, setSyncing] = useState(false);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  const fetchPlans = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch("/api/admin/plans", {
        headers: { "Authorization": `Bearer ${session.access_token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch plans");
      setData(await res.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [supabase]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const method = isEditing.id ? "PATCH" : "POST";
      const res = await fetch("/api/admin/plans", {
        method,
        headers: { 
          "Authorization": `Bearer ${session?.access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(isEditing)
      });
      if (!res.ok) throw new Error("Save failed");
      await fetchPlans();
      setIsEditing(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSyncPlans = async () => {
    setSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/admin/sync-plans", {
        method: "POST",
        headers: { "Authorization": `Bearer ${session?.access_token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sync failed");
      alert(data.message);
      await fetchPlans();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 text-cyan-400 animate-spin" /></div>;
  }
  if (error) {
    return <div className="p-4 bg-red-500/10 text-red-400 border border-red-500/30 rounded font-mono text-sm">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-pixel uppercase tracking-widest text-zinc-800 dark:text-zinc-200">Subscription Matrix</h2>
        <div className="flex gap-4">
          <button 
            disabled={syncing}
            onClick={handleSyncPlans}
            className="inline-flex items-center gap-2 px-4 py-2 border border-[#014b5c] dark:border-cyan-500 text-[#014b5c] dark:text-cyan-500 font-mono text-xs uppercase tracking-widest rounded transition-all hover:bg-cyan-500/10 active:scale-95 disabled:opacity-50"
          >
            {syncing && <Loader2 className="w-4 h-4 animate-spin" />}
            Sync Gateways
          </button>
          <button 
            onClick={() => setIsEditing({ 
              name: "", 
              price_usd_cents: 0, 
              price_inr_paise: 0, 
              discount_usd_cents: 0, 
              discount_inr_paise: 0,
              page_extraction_limit: 1000, 
              paddle_product_id: "", 
              paddle_price_id: "", 
              paypal_plan_id: "",
              cashfree_plan_id: "",
              display_order: 0,
              is_active: true 
            })}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#014b5c] dark:bg-cyan-500 text-white dark:text-black font-mono text-xs uppercase tracking-widest rounded transition-transform active:scale-95 hover:brightness-110"
          >
            <Plus className="w-4 h-4" /> Initialize Plan
          </button>
        </div>
      </div>

      {isEditing && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-6 md:p-8 border border-cyan-500/30 bg-cyan-500/5 rounded-xl mb-8 shadow-[0_0_30px_rgba(34,211,238,0.1)]">
          <h3 className="font-mono uppercase tracking-widest text-lg text-[#014b5c] dark:text-cyan-400 mb-6 border-b border-cyan-500/20 pb-4">
            {isEditing.id ? "Modify Node Plan" : "Create Node Plan"}
          </h3>
          <form onSubmit={handleSave} className="font-mono text-sm space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              <div className="space-y-4">
                <h4 className="text-xs text-zinc-500 mb-4 uppercase tracking-widest">Base Attributes</h4>
                <div>
                  <label className="block text-zinc-500 text-xs mb-1">Plan Name</label>
                  <input required type="text" value={isEditing.name || ""} onChange={e => setIsEditing({...isEditing, name: e.target.value})} className="w-full p-2.5 rounded bg-white dark:bg-black border border-zinc-200 dark:border-white/10 outline-none focus:border-cyan-500 text-black dark:text-white" />
                </div>
                
                  <div>
                    <label className="block text-zinc-500 text-xs mb-1">Price (USD Cents)</label>
                    <input required type="number" value={isEditing.price_usd_cents || 0} onChange={e => setIsEditing({...isEditing, price_usd_cents: parseInt(e.target.value) || 0})} className="w-full p-2.5 rounded bg-white dark:bg-black border border-zinc-200 dark:border-white/10 outline-none focus:border-cyan-500 text-black dark:text-white" />
                  </div>

                  <div>
                    <label className="block text-zinc-500 text-xs mb-1">Price (INR Paise)</label>
                    <input required type="number" value={isEditing.price_inr_paise || 0} onChange={e => setIsEditing({...isEditing, price_inr_paise: parseInt(e.target.value) || 0})} className="w-full p-2.5 rounded bg-white dark:bg-black border border-zinc-200 dark:border-white/10 outline-none focus:border-cyan-500 text-black dark:text-white" />
                  </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-zinc-500 text-xs mb-1">Page Limit</label>
                    <input required type="number" value={isEditing.page_extraction_limit || 0} onChange={e => setIsEditing({...isEditing, page_extraction_limit: parseInt(e.target.value) || 0})} className="w-full p-2.5 rounded bg-white dark:bg-black border border-zinc-200 dark:border-white/10 outline-none focus:border-cyan-500 text-black dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-zinc-500 text-xs mb-1">Display Order</label>
                    <input type="number" value={isEditing.display_order || 0} onChange={e => setIsEditing({...isEditing, display_order: parseInt(e.target.value) || 0})} className="w-full p-2.5 rounded bg-white dark:bg-black border border-zinc-200 dark:border-white/10 outline-none focus:border-cyan-500 text-black dark:text-white" />
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-500 text-xs mb-1">Status</label>
                  <select value={isEditing.is_active ? 'true' : 'false'} onChange={e => setIsEditing({...isEditing, is_active: e.target.value === 'true'})} className="w-full p-2.5 rounded bg-white dark:bg-black border border-zinc-200 dark:border-white/10 outline-none focus:border-cyan-500 text-black dark:text-white">
                    <option value="true">Active (Visible)</option>
                    <option value="false">Inactive (Hidden)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs text-zinc-500 mb-4 uppercase tracking-widest">Gateway Integration Keys</h4>
                
                <div className="p-4 border border-zinc-200 dark:border-white/10 rounded-lg bg-zinc-50 dark:bg-[#0a0a0a] space-y-4">
                  <h5 className="text-xs text-[#014b5c] dark:text-cyan-400 font-semibold uppercase">PayPal (Rest of World)</h5>
                  <div>
                    <label className="block text-zinc-500 text-xs mb-1">PayPal Plan ID</label>
                    <input type="text" value={isEditing.paypal_plan_id || ""} onChange={e => setIsEditing({...isEditing, paypal_plan_id: e.target.value})} className="w-full p-2.5 rounded bg-white dark:bg-black border border-zinc-200 dark:border-white/10 outline-none focus:border-cyan-500 text-black dark:text-white" placeholder="P-xxxxxxxxxxxxxxxxxx" />
                  </div>
                </div>

                <div className="p-4 border border-zinc-200 dark:border-white/10 rounded-lg bg-zinc-50 dark:bg-[#0a0a0a] space-y-4">
                  <h5 className="text-xs text-[#014b5c] dark:text-cyan-400 font-semibold uppercase">Cashfree (India)</h5>
                  <div>
                    <label className="block text-zinc-500 text-xs mb-1">Cashfree Plan ID</label>
                    <input type="text" value={isEditing.cashfree_plan_id || ""} onChange={e => setIsEditing({...isEditing, cashfree_plan_id: e.target.value})} className="w-full p-2.5 rounded bg-white dark:bg-black border border-zinc-200 dark:border-white/10 outline-none focus:border-cyan-500 text-black dark:text-white" placeholder="plan_xxxxxxxx" />
                  </div>
                </div>

              </div>
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t border-cyan-500/20">
              <button type="button" onClick={() => setIsEditing(null)} className="px-6 py-2 border border-zinc-200 dark:border-white/10 rounded text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 uppercase tracking-widest text-xs font-bold transition-colors">Cancel</button>
              <button disabled={saving} type="submit" className="px-6 py-2 bg-[#014b5c] dark:bg-cyan-500 text-white dark:text-black rounded hover:brightness-110 flex items-center gap-2 uppercase tracking-widest text-xs font-bold transition-all active:scale-95 shadow-[0_0_15px_rgba(34,211,238,0.4)]">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {isEditing.id ? "Update Sequence" : "Deploy Sequence"}
              </button>
            </div>
          </form>
        </motion.div>
      )}
      
      <div className="grid grid-cols-1 gap-4">
        {data.plans.map((plan: any) => (
          <div key={plan.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border border-zinc-200 dark:border-white/10 rounded-lg bg-white dark:bg-[#050505] hover:border-cyan-500/30 transition-colors">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-pixel text-black dark:text-white uppercase">{plan.name}</h3>
                {plan.is_active ? (
                  <span className="flex items-center gap-1 text-[10px] font-mono text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-500/10 px-2 py-0.5 rounded-full"><CheckCircle2 className="w-3 h-3" /> Active</span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-mono text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full"><XCircle className="w-3 h-3" /> Inactive</span>
                )}
              </div>
              <div className="flex flex-wrap gap-4 text-xs font-mono text-zinc-500 mt-3 bg-zinc-50 dark:bg-white/5 p-3 rounded border border-zinc-200 dark:border-white/10">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600">Base Price</span>
                  <span className="text-black dark:text-white">${((plan.price_usd_cents || 0) / 100).toFixed(2)} / ₹{((plan.price_inr_paise || 0) / 100).toFixed(2)}</span>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600">Limit</span>
                  <span className="text-black dark:text-white">{plan.page_extraction_limit} pages</span>
                </div>

                {plan.paypal_plan_id && (
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600">PayPal</span>
                    <span className="text-black dark:text-white">{plan.paypal_plan_id}</span>
                  </div>
                )}
                {plan.cashfree_plan_id && (
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600">Cashfree</span>
                    <span className="text-black dark:text-white">{plan.cashfree_plan_id}</span>
                  </div>
                )}
              </div>
            </div>
            
            <button 
              onClick={() => setIsEditing(plan)}
              className="mt-4 md:mt-0 p-2 text-zinc-400 hover:text-cyan-500 bg-zinc-50 dark:bg-white/5 hover:bg-cyan-500/10 rounded transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
