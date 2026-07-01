import { createClient } from '../../../../utils/supabase/server';
import { redirect } from 'next/navigation';
import { db } from '../../../../db';
import { aiCreditPackProducts } from '../../../../db/schema';
import { eq } from 'drizzle-orm';
import { Package } from 'lucide-react';
import { UsageService } from '../../../../lib/billing/UsageService';
import CreditPacksClient from './CreditPacksClient';

export const dynamic = 'force-dynamic';

export default async function CreditPacksPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  // Fetch available request packs
  const packs = await db.query.aiCreditPackProducts.findMany({
    where: eq(aiCreditPackProducts.isActive, true),
    orderBy: (products, { asc }) => [asc(products.displayOrder), asc(products.priceCents)],
  });

  // Fetch user's current balance
  const balance = await UsageService.getOrCreateBalance(session.user.id);
  const purchasedRemaining = balance?.purchasedRemainingCredits || 0;

  return (
    <div className="p-8 lg:p-12 max-w-7xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Package className="w-8 h-8 text-violet-500" />
          AI Credit Packs
        </h1>
        <p className="text-neutral-500 mt-2 text-lg">
          Need more AI Credits this month? Purchase a one-time pack. Packs never expire and are consumed only after your monthly quota is depleted.
        </p>
      </div>

      <div className="bg-violet-50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-900 rounded-xl p-6 mb-10 flex justify-between items-center">
        <div>
          <h3 className="text-sm font-bold text-violet-800 dark:text-violet-300 uppercase tracking-wider mb-1">Purchased Pack Balance</h3>
          <p className="text-3xl font-bold text-violet-600 dark:text-violet-400">
            {purchasedRemaining.toLocaleString()} <span className="text-lg font-medium text-violet-500">credits</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <CreditPacksClient packs={packs} />
      </div>
    </div>
  );
}
