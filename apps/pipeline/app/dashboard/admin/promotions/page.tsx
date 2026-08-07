"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Loader2, Plus, Edit2, CheckCircle2, XCircle, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminPromotions() {
  const [promotions, setPromotions] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState<any>(null); // Promotion object being edited/created
  const [saving, setSaving] = useState(false);
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  const fetchPromotions = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch("/api/admin/promotions", {
        headers: { "Authorization": `Bearer ${session.access_token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch promotions");
      const data = await res.json();
      setPromotions(data.promotions);
      setPlans(data.plans);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, [supabase]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const method = isEditing.id ? "PATCH" : "POST";
      const res = await fetch("/api/admin/promotions", {
        method,
        headers: { 
          "Authorization": `Bearer ${session?.access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(isEditing)
      });
      if (!res.ok) throw new Error("Save failed");
      await fetchPromotions();
      setIsEditing(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this promotion?")) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/admin/promotions?id=${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${session?.access_token}` }
      });
      if (!res.ok) throw new Error("Delete failed");
      await fetchPromotions();
    } catch (err: any) {
      alert(err.message);
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
        <h2 className="text-xl font-pixel uppercase tracking-widest text-zinc-800 dark:text-zinc-200">Promotions Engine</h2>
        <button 
          onClick={() => setIsEditing({ 
            name: "", 
            discount_type: "percentage", 
            discount_value: 0, 
            country_code: "", 
            offer_type: "normal",
            target_plan_id: "",
            is_active: true 
          })}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#014b5c] dark:bg-cyan-500 text-white dark:text-black font-mono text-xs uppercase tracking-widest rounded transition-transform active:scale-95 hover:brightness-110"
        >
          <Plus className="w-4 h-4" /> Initialize Promo
        </button>
      </div>

      {isEditing && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-6 md:p-8 border border-cyan-500/30 bg-cyan-500/5 rounded-xl mb-8 shadow-[0_0_30px_rgba(34,211,238,0.1)]">
          <h3 className="font-mono uppercase tracking-widest text-lg text-[#014b5c] dark:text-cyan-400 mb-6 border-b border-cyan-500/20 pb-4">
            {isEditing.id ? "Modify Promotion" : "Deploy Promotion"}
          </h3>
          <form onSubmit={handleSave} className="font-mono text-sm space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              <div className="space-y-4">
                <h4 className="text-xs text-zinc-500 mb-4 uppercase tracking-widest">Base Attributes</h4>
                
                <div>
                  <label className="block text-zinc-500 text-xs mb-1">Promotion Name</label>
                  <input required type="text" value={isEditing.name || ""} onChange={e => setIsEditing({...isEditing, name: e.target.value})} className="w-full p-2.5 rounded bg-white dark:bg-black border border-zinc-200 dark:border-white/10 outline-none focus:border-cyan-500 text-black dark:text-white" placeholder="e.g., Diwali Special" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-zinc-500 text-xs mb-1">Discount Type</label>
                    <select value={isEditing.discount_type} onChange={e => setIsEditing({...isEditing, discount_type: e.target.value})} className="w-full p-2.5 rounded bg-white dark:bg-black border border-zinc-200 dark:border-white/10 outline-none focus:border-cyan-500 text-black dark:text-white">
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed_amount">Fixed Amount (Cents/Paise)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-zinc-500 text-xs mb-1">Discount Value</label>
                    <input required type="number" value={isEditing.discount_value || 0} onChange={e => setIsEditing({...isEditing, discount_value: parseInt(e.target.value) || 0})} className="w-full p-2.5 rounded bg-white dark:bg-black border border-zinc-200 dark:border-white/10 outline-none focus:border-cyan-500 text-black dark:text-white" />
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-500 text-xs mb-1">Status</label>
                  <select value={isEditing.is_active ? 'true' : 'false'} onChange={e => setIsEditing({...isEditing, is_active: e.target.value === 'true'})} className="w-full p-2.5 rounded bg-white dark:bg-black border border-zinc-200 dark:border-white/10 outline-none focus:border-cyan-500 text-black dark:text-white">
                    <option value="true">Active (Live)</option>
                    <option value="false">Inactive (Disabled)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs text-zinc-500 mb-4 uppercase tracking-widest">Targeting & Constraints</h4>
                
                <div>
                  <label className="block text-zinc-500 text-xs mb-1">Offer Type</label>
                  <select value={isEditing.offer_type} onChange={e => setIsEditing({...isEditing, offer_type: e.target.value})} className="w-full p-2.5 rounded bg-white dark:bg-black border border-zinc-200 dark:border-white/10 outline-none focus:border-cyan-500 text-black dark:text-white">
                    <option value="normal">Normal Discount</option>
                    <option value="signup_first_month">Signup - First Month Only</option>
                    <option value="festival_bonus">Festival Bonus</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-500 text-xs mb-1">Country Target (Optional)</label>
                  <select value={isEditing.country_code || ""} onChange={e => setIsEditing({...isEditing, country_code: e.target.value})} className="w-full p-2.5 rounded bg-white dark:bg-black border border-zinc-200 dark:border-white/10 outline-none focus:border-cyan-500 text-black dark:text-white">
                    <option value="">Global (All Countries)</option>
                    <option value="IN">India (IN)</option>
                    <option value="US">United States (US)</option>
                    <option value="AU">Australia (AU)</option>
                    <option value="UK">United Kingdom (UK)</option>
                    <option value="CA">Canada (CA)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-500 text-xs mb-1">Plan Target (Optional)</label>
                  <select value={isEditing.target_plan_id || ""} onChange={e => setIsEditing({...isEditing, target_plan_id: e.target.value ? parseInt(e.target.value) : ""})} className="w-full p-2.5 rounded bg-white dark:bg-black border border-zinc-200 dark:border-white/10 outline-none focus:border-cyan-500 text-black dark:text-white">
                    <option value="">All Plans</option>
                    {plans.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
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
        {promotions.length === 0 && (
          <div className="p-8 text-center text-zinc-500 font-mono text-sm border border-dashed border-zinc-200 dark:border-white/10 rounded-xl">
            No promotions active. Initialize a promo above.
          </div>
        )}
        {promotions.map((promo: any) => {
          const planTarget = plans.find(p => p.id === promo.target_plan_id)?.name || "All Plans";
          const location = promo.country_code ? promo.country_code : "Global";
          const discountStr = promo.discount_type === 'percentage' 
            ? `${promo.discount_value}% OFF`
            : `-${(promo.discount_value / 100).toFixed(2)} OFF`;

          return (
            <div key={promo.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border border-zinc-200 dark:border-white/10 rounded-lg bg-white dark:bg-[#050505] hover:border-cyan-500/30 transition-colors">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-pixel text-black dark:text-white uppercase">{promo.name}</h3>
                  {promo.is_active ? (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-500/10 px-2 py-0.5 rounded-full"><CheckCircle2 className="w-3 h-3" /> Active</span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full"><XCircle className="w-3 h-3" /> Inactive</span>
                  )}
                  <span className="ml-2 text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-500/10 px-2 py-0.5 rounded">
                    {discountStr}
                  </span>
                </div>
                <div className="flex flex-wrap gap-4 text-xs font-mono text-zinc-500 mt-3 bg-zinc-50 dark:bg-white/5 p-3 rounded border border-zinc-200 dark:border-white/10">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600">Type</span>
                    <span className="text-black dark:text-white capitalize">{promo.offer_type.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600">Location</span>
                    <span className="text-black dark:text-white">{location}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600">Plan Target</span>
                    <span className="text-black dark:text-white">{planTarget}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mt-4 md:mt-0">
                <button 
                  onClick={() => setIsEditing(promo)}
                  className="p-2 text-zinc-400 hover:text-cyan-500 bg-zinc-50 dark:bg-white/5 hover:bg-cyan-500/10 rounded transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(promo.id)}
                  className="p-2 text-zinc-400 hover:text-red-500 bg-zinc-50 dark:bg-white/5 hover:bg-red-500/10 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
