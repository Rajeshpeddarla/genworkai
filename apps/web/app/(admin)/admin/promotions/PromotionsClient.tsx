"use client";

import { useState } from "react";
import { Plus, Tag, Calendar, Percent, CheckCircle2, Gift } from "lucide-react";
import { createPromotion, togglePromotion } from "./actions";

export default function PromotionsClient({ initialPromos }: { initialPromos: any[] }) {
  const [showForm, setShowForm] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    let valueObj: any = {};
    const type = formData.get("type") as string;
    const value = formData.get("value") as string;

    if (type === "discount") {
      valueObj = { discountPercent: parseInt(value) };
    } else if (type === "free_months") {
      valueObj = { freeMonths: parseInt(value) };
    }

    const data = {
      code: formData.get("code") as string,
      type: type,
      description: formData.get("description") as string || `${type} promotion`,
      value: valueObj,
      paddleDiscountId: formData.get("paddleDiscountId") as string || null,
      isActive: true,
    };

    await createPromotion(data);
    setShowForm(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Promotions & Coupons</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Manage discount codes and contract offers.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg flex items-center gap-2 font-medium"
        >
          <Plus className="w-4 h-4" /> Create Promotion
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {initialPromos.map(promo => (
          <div key={promo.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl p-6">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${promo.type === 'discount' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-violet-500/20 text-violet-500'}`}>
                  {promo.type === 'discount' ? <Percent className="w-5 h-5" /> : <Gift className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-zinc-900 dark:text-white font-bold tracking-tight uppercase">{promo.code}</h3>
                  <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded-full mt-1 inline-block ${promo.isActive ? 'bg-green-500/20 text-green-600 dark:text-green-400' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
                    {promo.isActive ? 'Active' : 'Expired'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-6">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{promo.description}</p>
              <p className="text-lg font-medium text-zinc-900 dark:text-white">
                {promo.type === 'discount' ? `${promo.value?.discountPercent || 0}% off` : `${promo.value?.freeMonths || 0} Months Free`}
              </p>
              {promo.paddleDiscountId && (
                <p className="text-xs font-mono text-zinc-500">Paddle ID: {promo.paddleDiscountId}</p>
              )}
            </div>

            <div className="pt-4 border-t border-zinc-200 dark:border-white/10 flex justify-between items-center text-sm text-zinc-500">
              <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {promo.duration ? `${promo.duration} months` : 'No expiration'}</span>
              <button 
                onClick={() => togglePromotion(promo.id, !promo.isActive)}
                className="text-rose-600 hover:text-rose-700 font-medium"
              >
                {promo.isActive ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {showForm && (
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-2xl p-8 mt-12 shadow-sm">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">Create New Promotion</h2>
          <form onSubmit={handleCreate}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">Promo Code</label>
                  <div className="relative">
                    <Tag className="w-5 h-5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input name="code" type="text" placeholder="e.g. BLACKFRIDAY" required className="w-full bg-transparent border border-zinc-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-zinc-900 dark:text-white focus:border-rose-500 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">Promotion Type</label>
                  <select name="type" className="w-full bg-transparent border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-zinc-900 dark:text-white outline-none">
                    <option value="discount">Percentage Discount</option>
                    <option value="free_months">Free Months</option>
                  </select>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">Value (Percent or Months)</label>
                  <input name="value" type="number" placeholder="e.g. 20" required className="w-full bg-transparent border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-zinc-900 dark:text-white outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">Description</label>
                  <input name="description" type="text" placeholder="e.g. 20% off all plans" className="w-full bg-transparent border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-zinc-900 dark:text-white outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">Paddle Discount ID (Optional)</label>
                  <input name="paddleDiscountId" type="text" placeholder="e.g. dsc_01h8..." className="w-full bg-transparent border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-zinc-900 dark:text-white outline-none font-mono text-sm" />
                </div>
              </div>
            </div>
            <div className="mt-8 flex justify-end">
              <button type="submit" className="px-6 py-2.5 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-black rounded-xl font-bold flex items-center gap-2 transition-colors">
                <CheckCircle2 className="w-5 h-5" /> Save Promotion
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
