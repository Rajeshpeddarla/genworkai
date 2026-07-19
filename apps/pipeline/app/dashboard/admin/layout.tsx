"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { LayoutDashboard, Users, CreditCard, Loader2 } from "lucide-react";
import TransitionWrapper from "../../TransitionWrapper";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      
      let admin = false;
      if (user.email === 'base@parseadmin.admin') {
        admin = true;
      } else {
        const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
        if (data && data.is_admin) admin = true;
      }
      
      if (admin) {
        setIsAuthorized(true);
      } else {
        router.push("/dashboard");
      }
    }
    checkAuth();
  }, [router, supabase]);

  if (isAuthorized === null) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  const tabs = [
    { name: "Overview", href: "/dashboard/admin", icon: LayoutDashboard },
    { name: "Users", href: "/dashboard/admin/users", icon: Users },
    { name: "Plans", href: "/dashboard/admin/plans", icon: CreditCard },
  ];

  return (
    <TransitionWrapper>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-pixel uppercase text-[#014b5c] dark:text-cyan-400">Admin Control</h1>
            <p className="text-sm font-mono text-zinc-500 uppercase tracking-widest mt-1">System Management Node</p>
          </div>
          
          <div className="flex overflow-x-auto custom-scrollbar gap-2 bg-white dark:bg-black p-1 border border-zinc-200 dark:border-white/10 rounded-lg">
            {tabs.map((tab) => {
              const isActive = pathname === tab.href;
              return (
                <Link
                  key={tab.name}
                  href={tab.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded font-mono text-xs uppercase tracking-widest transition-colors whitespace-nowrap ${
                    isActive
                      ? "bg-[#014b5c]/10 dark:bg-cyan-400/20 text-[#014b5c] dark:text-cyan-400 border border-[#014b5c]/20 dark:border-cyan-400/30"
                      : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.name}
                </Link>
              );
            })}
          </div>
        </div>
        
        <div className="bg-white dark:bg-black border border-zinc-200 dark:border-white/10 rounded-xl p-6 min-h-[60vh]">
          {children}
        </div>
      </div>
    </TransitionWrapper>
  );
}
