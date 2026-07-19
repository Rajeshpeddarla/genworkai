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
        <button 
          onClick={() => setIsEditing({ name: "", price_cents: 0, page_extraction_limit: 1000, paddle_product_id: "", paddle_price_id: "", is_active: true })}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#014b5c] dark:bg-cyan-500 text-white dark:text-black font-mono text-xs uppercase tracking-widest rounded transition-transform active:scale-95 hover:brightness-110"
        >
          <Plus className="w-4 h-4" /> Initialize Plan
        </button>
      </div>

      {isEditing && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-6 border border-cyan-500/30 bg-cyan-500/5 rounded-lg mb-8">
          <h3 className="font-mono uppercase tracking-widest text-sm text-[#014b5c] dark:text-cyan-400 mb-4">
            {isEditing.id ? "Modify Node Plan" : "Create Node Plan"}
          </h3>
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-sm">
            <div>
              <label className="block text-zinc-500 text-xs mb-1">Plan Name</label>
              <input required type="text" value={isEditing.name} onChange={e => setIsEditing({...isEditing, name: e.target.value})} className="w-full p-2 rounded bg-white dark:bg-black border border-zinc-200 dark:border-white/10 outline-none focus:border-cyan-500 text-black dark:text-white" />
            </div>
            <div>
              <label className="block text-zinc-500 text-xs mb-1">Price (Cents)</label>
              <input required type="number" value={isEditing.price_cents} onChange={e => setIsEditing({...isEditing, price_cents: parseInt(e.target.value)})} className="w-full p-2 rounded bg-white dark:bg-black border border-zinc-200 dark:border-white/10 outline-none focus:border-cyan-500 text-black dark:text-white" />
            </div>
            <div>
              <label className="block text-zinc-500 text-xs mb-1">Page Limit</label>
              <input required type="number" value={isEditing.page_extraction_limit} onChange={e => setIsEditing({...isEditing, page_extraction_limit: parseInt(e.target.value)})} className="w-full p-2 rounded bg-white dark:bg-black border border-zinc-200 dark:border-white/10 outline-none focus:border-cyan-500 text-black dark:text-white" />
            </div>
            <div>
              <label className="block text-zinc-500 text-xs mb-1">Status</label>
              <select value={isEditing.is_active ? 'true' : 'false'} onChange={e => setIsEditing({...isEditing, is_active: e.target.value === 'true'})} className="w-full p-2 rounded bg-white dark:bg-black border border-zinc-200 dark:border-white/10 outline-none focus:border-cyan-500 text-black dark:text-white">
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

            <div className="md:col-span-2 p-4 border border-zinc-200 dark:border-white/10 rounded mt-2 bg-zinc-50 dark:bg-[#0a0a0a]">
              <h4 className="text-xs text-zinc-500 mb-4">Paddle Integration (Sync with GenWorkAI structure)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-500 text-xs mb-1">Paddle Product</label>
                  <select 
                    value={isEditing.paddle_product_id || ""} 
                    onChange={e => setIsEditing({...isEditing, paddle_product_id: e.target.value, paddle_price_id: ""})} 
                    className="w-full p-2 rounded bg-white dark:bg-black border border-zinc-200 dark:border-white/10 outline-none focus:border-cyan-500 text-black dark:text-white"
                  >
                    <option value="">Select Product...</option>
                    {data.paddleProducts.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-500 text-xs mb-1">Paddle Price</label>
                  <select 
                    value={isEditing.paddle_price_id || ""} 
                    onChange={e => setIsEditing({...isEditing, paddle_price_id: e.target.value})} 
                    className="w-full p-2 rounded bg-white dark:bg-black border border-zinc-200 dark:border-white/10 outline-none focus:border-cyan-500 text-black dark:text-white"
                    disabled={!isEditing.paddle_product_id}
                  >
                    <option value="">Select Price...</option>
                    {data.paddleProducts.find((p: any) => p.id === isEditing.paddle_product_id)?.prices.map((price: any) => (
                      <option key={price.id} value={price.id}>{price.description} ({price.id})</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 flex justify-end gap-3 mt-4">
              <button type="button" onClick={() => setIsEditing(null)} className="px-4 py-2 border border-zinc-200 dark:border-white/10 rounded text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5">Cancel</button>
              <button disabled={saving} type="submit" className="px-4 py-2 bg-[#014b5c] dark:bg-cyan-500 text-white dark:text-black rounded hover:brightness-110 flex items-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {isEditing.id ? "Update Plan" : "Create Plan"}
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
              <div className="flex flex-wrap gap-4 text-xs font-mono text-zinc-500 mt-2">
                <div><span className="text-zinc-400 dark:text-zinc-600">Price:</span> ${(plan.price_cents / 100).toFixed(2)}</div>
                <div><span className="text-zinc-400 dark:text-zinc-600">Limit:</span> {plan.page_extraction_limit} pages</div>
                {plan.paddle_product_id && (
                  <div><span className="text-zinc-400 dark:text-zinc-600">Product:</span> {plan.paddle_product_id}</div>
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
