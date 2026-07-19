import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Client } from "pg";
import { Activity, Database, Key, LayoutTemplate } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardOverview() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch the user's plan and stats
  const connectionString = process.env.DATABASE_URL;
  let userPlan = null;
  let pricingPlan = null;
  let documentCount = 0;
  
  if (connectionString) {
    const client = new Client({ connectionString });
    try {
      await client.connect();
      // Ensure user has a profile
      const profileCheck = await client.query('SELECT id FROM profiles WHERE id = $1', [user.id]);
      if (profileCheck.rows.length === 0) {
        await client.query('INSERT INTO profiles (id, email, is_admin) VALUES ($1, $2, $3)', [user.id, user.email, user.email === 'base@parseadmin.admin']);
      }
      
      // Ensure user has a free plan row
      const planRes = await client.query(`
        SELECT up.*, p.name as plan_name, p.page_extraction_limit 
        FROM baseparse_user_plans up
        LEFT JOIN baseparse_pricing_plans p ON p.id = up.plan_id
        WHERE up.user_id = $1
      `, [user.id]);
      
      if (planRes.rows.length === 0) {
        // Find the Free plan
        const freePlanRes = await client.query(`SELECT id, name, page_extraction_limit FROM baseparse_pricing_plans WHERE price_cents = 0 LIMIT 1`);
        if (freePlanRes.rows.length > 0) {
          const fp = freePlanRes.rows[0];
          await client.query(`INSERT INTO baseparse_user_plans (user_id, plan_id) VALUES ($1, $2)`, [user.id, fp.id]);
          userPlan = { pages_extracted_this_month: 0 };
          pricingPlan = fp;
        }
      } else {
        userPlan = planRes.rows[0];
        pricingPlan = {
          name: planRes.rows[0].plan_name,
          page_extraction_limit: planRes.rows[0].page_extraction_limit
        };
      }

      const docRes = await client.query(`SELECT COUNT(*) as count FROM baseparse_documents WHERE user_id = $1`, [user.id]);
      documentCount = parseInt(docRes.rows[0].count);
    } catch (e) {
      console.error(e);
    } finally {
      await client.end();
    }
  }

  const pagesExtracted = userPlan?.pages_extracted_this_month || 0;
  const pageLimit = pricingPlan?.page_extraction_limit || 100;
  const progressPercent = Math.min((pagesExtracted / pageLimit) * 100, 100);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div>
        <h1 className="font-pixel text-3xl uppercase tracking-wider mb-2">Node Status</h1>
        <p className="font-mono text-zinc-500 text-sm uppercase tracking-widest">
          Welcome back, {user.email}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Usage Card */}
        <div className="md:col-span-2 border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#050505] p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/5 blur-3xl rounded-full" />
          <div className="flex items-center justify-between mb-8 relative z-10">
            <div>
              <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-500 mb-1">Current Allocation</h2>
              <div className="font-pixel text-xl text-cyan-400 uppercase">{pricingPlan?.name || "Free"} Node</div>
            </div>
            <Activity className="w-8 h-8 text-white/20" />
          </div>

          <div className="space-y-3 relative z-10">
            <div className="flex justify-between font-mono text-sm">
              <span className="text-zinc-500 dark:text-zinc-400">Extraction Payload</span>
              <span className="text-black dark:text-white">{pagesExtracted} / {pageLimit} pages</span>
            </div>
            <div className="h-2 w-full bg-zinc-200 dark:bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)] transition-all duration-1000"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Stats Card */}
        <div className="border border-zinc-200 dark:border-white/10 bg-white dark:bg-black p-6">
          <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-500 mb-6">Metrics</h2>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-zinc-100 dark:bg-white/5 text-cyan-400 rounded-sm border border-zinc-200 dark:border-white/10">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <div className="font-pixel text-xl">{documentCount}</div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">Documents</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-zinc-100 dark:bg-white/5 text-violet-400 rounded-sm border border-zinc-200 dark:border-white/10">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <div className="font-pixel text-xl">Active</div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">API Status</div>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
