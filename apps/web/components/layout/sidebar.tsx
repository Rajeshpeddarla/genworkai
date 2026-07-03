"use client";

import { cn, formatBytes } from "../../lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBillingStore } from "../../store/billing";
import { useState, useEffect } from "react";
import { 
  FileText, 
  FolderOpen,
  LayoutDashboard,
  Settings,
  User,
  Database,
  Network,
  CreditCard,
  Zap,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  LifeBuoy,
  Terminal,
  HelpCircle
} from "lucide-react";

const navigation = [
  { name: "Dashboards & BI", href: "/dashboards", icon: LayoutDashboard },
  { name: "Automation Studio", href: "/automation-studio", icon: Zap },
  { name: "File Studio", href: "/file-studio", icon: FolderOpen },
  { name: "Database Intelligence", href: "/databases", icon: Database },
  { name: "Knowledge Base", href: "/knowledge", icon: Database },
  { name: "Workspace", href: "/workspace", icon: LayoutDashboard },
  { name: "MCP Builder", href: "/mcp-builder", icon: Network },
];

const secondaryNavigation = [
  { name: "Support", href: "/support", icon: LifeBuoy },
  { name: "Developer", href: "/developer/docs", icon: Terminal },
  { name: "Admin", href: "/admin", icon: ShieldCheck },
  { name: "Billing Studio", href: "/billing", icon: CreditCard },
  { name: "Settings", href: "/settings", icon: Settings },
];

function SidebarTierWidget() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchProfile = () => {
      fetch('/api/profile')
        .then(res => res.json())
        .then(d => {
          if (isMounted) setData(d);
        })
        .catch(console.error);
    };
    
    fetchProfile();
    const interval = setInterval(fetchProfile, 10000); // Poll every 10s for live credit updates
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const aiCredits = data?.limits?.aiCredits;
  const current = aiCredits?.current || 0;
  const monthly = aiCredits?.monthly || 0;
  const purchased = aiCredits?.purchased || 0;
  const limit = aiCredits?.monthlyLimit || 0;
  const resetAt = aiCredits?.resetAt ? new Date(aiCredits.resetAt) : null;
  
  // Setup next reset date (1st of next month)
  const nextResetDate = new Date();
  nextResetDate.setMonth(nextResetDate.getMonth() + 1);
  nextResetDate.setDate(1);

  // Calculate percentage based on monthly usage (0 to 100)
  const percentUsed = limit > 0 ? Math.min(100, Math.max(0, ((limit - monthly) / limit) * 100)) : 0;
  const monthlyRemainingPercent = limit > 0 ? Math.max(0, (monthly / limit) * 100) : 0;

  const context = data?.limits?.context;
  const contextLimitFormatted = context?.limit > 0 ? formatBytes(context.limit, 1) : "0 B";
  const contextCurrentFormatted = context?.current > 0 ? formatBytes(context.current, 1) : "0 B";
  const contextPercent = context?.limit > 0 ? Math.min(100, Math.max(0, (context.current / context.limit) * 100)) : 0;

  if (!data) {
    return (
      <div className="p-4 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 mb-4 animate-pulse h-28" />
    );
  }

  return (
    <div className="p-4 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 mb-4 transition-all hover:bg-zinc-200/50 dark:hover:bg-white/10">
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">AI Credits</span>
        <Link href="/billing" className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-500">Add Funds</Link>
      </div>

      {/* Monthly Credits Bar */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">Monthly Plan</span>
          <span className="text-[10px] font-medium text-zinc-700 dark:text-zinc-300">{monthly.toLocaleString()} / {limit.toLocaleString()}</span>
        </div>
        <div className="w-full bg-zinc-300 dark:bg-black/50 h-1.5 rounded-full overflow-hidden">
          <div className="bg-violet-500 h-full rounded-full transition-all duration-1000" style={{ width: `${monthlyRemainingPercent}%` }} />
        </div>
      </div>

      {/* Purchased Credits */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">Purchased Packs</span>
          <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">{purchased.toLocaleString()} left</span>
        </div>
      </div>

      {/* Context Size Limit */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">KB Size</span>
          <span className="text-[10px] font-medium text-zinc-700 dark:text-zinc-300">{contextCurrentFormatted} / {contextLimitFormatted}</span>
        </div>
        <div className="w-full bg-zinc-300 dark:bg-black/50 h-1.5 rounded-full overflow-hidden">
          <div className="bg-sky-500 h-full rounded-full transition-all duration-1000" style={{ width: `${contextPercent}%` }} />
        </div>
      </div>

      <div className="flex justify-between items-center mt-3 pt-3 border-t border-zinc-200 dark:border-white/10">
        <div className="flex flex-col">
          <span className="text-[10px] text-zinc-400 uppercase font-semibold">Total</span>
          <span className="text-xs font-bold text-zinc-900 dark:text-white">{current.toLocaleString()}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-zinc-400 uppercase font-semibold">Resets</span>
          <span className="text-[10px] text-zinc-600 dark:text-zinc-400">
            {nextResetDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/profile')
      .then(res => res.json())
      .then(d => {
        if (isMounted && d?.profile?.isAdmin) {
          setIsAdmin(true);
        }
      })
      .catch(console.error);
    return () => { isMounted = false; };
  }, []);

  const visibleSecondary = secondaryNavigation.filter(item => {
    if (item.name === "Admin" && !isAdmin) return false;
    return true;
  });

  return (
    <div className={cn(
      "flex shrink-0 flex-col gap-y-5 overflow-y-auto bg-zinc-50 dark:bg-zinc-950 px-4 pb-4 border-r border-zinc-200 dark:border-white/10 transition-all duration-300",
      isCollapsed ? "w-[80px] items-center" : "w-[260px]"
    )}>
      <div className={cn("flex h-16 shrink-0 items-center mt-2", isCollapsed ? "justify-center" : "justify-between w-full px-2")}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-500 to-fuchsia-500 flex items-center justify-center shrink-0">
            <Network className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">GenWorkAI</span>}
        </div>
        {!isCollapsed && (
          <button onClick={() => setIsCollapsed(true)} className="text-zinc-500 hover:text-white">
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {isCollapsed && (
        <button onClick={() => setIsCollapsed(false)} className="text-zinc-500 hover:text-white mt-[-10px] mb-2">
          <PanelLeftOpen className="w-4 h-4" />
        </button>
      )}

      <nav className="flex flex-1 flex-col w-full">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      (pathname === item.href || pathname.startsWith(item.href + '/'))
                        ? "bg-zinc-200/50 dark:bg-white/10 text-zinc-900 dark:text-white"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5",
                      "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors",
                      isCollapsed && "justify-center px-0"
                    )}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <item.icon
                      className={cn(
                        (pathname === item.href || pathname.startsWith(item.href + '/')) ? "text-violet-600 dark:text-white" : "text-zinc-400 dark:text-zinc-500 group-hover:text-violet-500 dark:group-hover:text-white",
                        "h-5 w-5 shrink-0 transition-colors"
                      )}
                      aria-hidden="true"
                    />
                    {!isCollapsed && item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </li>

          {/* Secondary Navigation */}
          <li className="mt-auto">
            <ul role="list" className="-mx-2 mt-2 space-y-1">
              {visibleSecondary.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      (pathname === item.href || pathname.startsWith(item.href + '/'))
                        ? "bg-zinc-200/50 dark:bg-white/10 text-zinc-900 dark:text-white"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5",
                      "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors",
                      isCollapsed && "justify-center px-0"
                    )}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <item.icon
                      className={cn(
                        (pathname === item.href || pathname.startsWith(item.href + '/')) ? "text-violet-600 dark:text-white" : "text-zinc-400 dark:text-zinc-500 group-hover:text-violet-500 dark:group-hover:text-white",
                        "h-5 w-5 shrink-0 transition-colors"
                      )}
                      aria-hidden="true"
                    />
                    {!isCollapsed && item.name}
                  </Link>
                </li>
              ))}

              {/* Extension Link below Settings */}
              <li className="mt-4">
                <Link
                  href="/extension"
                  className={cn(
                    "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:opacity-90",
                    isCollapsed && "justify-center px-0"
                  )}
                  title={isCollapsed ? "Extension" : undefined}
                >
                  <Zap className="h-5 w-5 shrink-0" aria-hidden="true" />
                  {!isCollapsed && "Extension"}
                </Link>
              </li>

              {/* Help & Documentation Link */}
              <li className="mt-2">
                <Link
                  href="/help"
                  className={cn(
                    "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors text-zinc-400 dark:text-zinc-500 hover:text-violet-500 dark:hover:text-white",
                    isCollapsed && "justify-center px-0"
                  )}
                  title={isCollapsed ? "Help & Documentation" : undefined}
                >
                  <HelpCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
                  {!isCollapsed && "Help"}
                </Link>
              </li>
            </ul>
          </li>

          {/* User Profile & Tier */}
          <li className="mt-auto pt-6 pb-2">
            {!isCollapsed ? (
              <SidebarTierWidget />
            ) : (
              <div className="w-10 h-10 mx-auto bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full flex items-center justify-center text-white font-bold" title="Free Tier">
                F
              </div>
            )}
          </li>

        </ul>
      </nav>
    </div>
  );
}
