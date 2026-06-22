"use client";

import { cn } from "../../lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  LayoutDashboard,
  Users,
  CreditCard,
  LifeBuoy,
  Tag,
  ToggleLeft,
  Activity,
  Settings,
  ArrowLeft,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut
} from "lucide-react";

const navigation = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Billing Studio", href: "/admin/billing", icon: CreditCard },
  { name: "Tickets", href: "/admin/tickets", icon: LifeBuoy },
  { name: "Promotions", href: "/admin/promotions", icon: Tag },
  { name: "Features", href: "/admin/features", icon: ToggleLeft },
  { name: "Analytics", href: "/admin/analytics", icon: Activity },
];

const secondaryNavigation = [
  { name: "Settings", href: "/admin/settings", icon: Settings },
  { name: "Back to App", href: "/dashboard", icon: ArrowLeft },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={cn(
      "flex shrink-0 flex-col gap-y-5 overflow-y-auto bg-zinc-950 px-4 pb-4 border-r border-white/10 transition-all duration-300",
      isCollapsed ? "w-[80px] items-center" : "w-[260px]"
    )}>
      <div className={cn("flex h-16 shrink-0 items-center mt-2", isCollapsed ? "justify-center" : "justify-between w-full px-2")}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-rose-500 to-orange-500 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && <span className="text-lg font-bold tracking-tight text-white">Admin Control</span>}
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
              {navigation.map((item) => {
                const isActive = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        isActive
                          ? "bg-white/10 text-white"
                          : "text-zinc-400 hover:text-white hover:bg-white/5",
                        "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors",
                        isCollapsed && "justify-center px-0"
                      )}
                      title={isCollapsed ? item.name : undefined}
                    >
                      <item.icon
                        className={cn(
                          isActive ? "text-rose-500" : "text-zinc-500 group-hover:text-rose-400",
                          "h-5 w-5 shrink-0 transition-colors"
                        )}
                        aria-hidden="true"
                      />
                      {!isCollapsed && item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>

          <li className="mt-auto">
            <ul role="list" className="-mx-2 mt-2 space-y-1">
              {secondaryNavigation.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        isActive
                          ? "bg-white/10 text-white"
                          : "text-zinc-400 hover:text-white hover:bg-white/5",
                        "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors",
                        isCollapsed && "justify-center px-0"
                      )}
                      title={isCollapsed ? item.name : undefined}
                    >
                      <item.icon
                        className={cn(
                          isActive ? "text-rose-500" : "text-zinc-500 group-hover:text-rose-400",
                          "h-5 w-5 shrink-0 transition-colors"
                        )}
                        aria-hidden="true"
                      />
                      {!isCollapsed && item.name}
                    </Link>
                  </li>
                );
              })}
              <li>
                <button
                  onClick={() => window.location.href = '/api/auth/signout'}
                  className={cn(
                    "w-full flex text-zinc-400 hover:text-white hover:bg-white/5",
                    "group gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors",
                    isCollapsed && "justify-center px-0"
                  )}
                  title={isCollapsed ? "Log Out" : undefined}
                >
                  <LogOut
                    className="h-5 w-5 shrink-0 text-zinc-500 group-hover:text-rose-400 transition-colors"
                    aria-hidden="true"
                  />
                  {!isCollapsed && "Log Out"}
                </button>
              </li>
            </ul>
          </li>
        </ul>
      </nav>
    </div>
  );
}
