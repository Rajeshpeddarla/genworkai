"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { 
  Terminal, 
  FileText, 
  Key, 
  CreditCard, 
  LogOut, 
  Menu,
  X,
  Server
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "../components/ThemeToggle";
import TransitionWrapper from "../TransitionWrapper";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [navItems, setNavItems] = useState([
    { name: "Terminal", href: "/dashboard", icon: Terminal },
    { name: "Testing Arena", href: "/dashboard/extract", icon: FileText },
    { name: "API Keys", href: "/dashboard/api-docs", icon: Key },
    { name: "Upgrade", href: "/dashboard/plans", icon: CreditCard },
  ]);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      let admin = false;
      if (user.email === 'base@parseadmin.admin') {
        admin = true;
      } else {
        const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
        if (data && data.is_admin) admin = true;
      }
      
      if (admin) {
        setIsAdmin(true);
        setNavItems(prev => {
          if (prev.some(item => item.name === "Admin")) return prev;
          return [...prev, { name: "Admin", href: "/dashboard/admin", icon: Server }];
        });
      }
    }
    checkAdmin();
  }, []);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await supabase.auth.signOut();
    router.push("/login");
  };

  const Sidebar = () => (
    <div className="h-full flex flex-col bg-zinc-50 dark:bg-[#050505] border-r border-zinc-200 dark:border-white/10 w-64 text-zinc-500 dark:text-zinc-400 font-mono text-sm shadow-[4px_0_24px_rgba(0,0,0,0.05)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.5)]">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-3 text-black dark:text-white group">
          <div className="relative w-8 h-8 flex items-center justify-center">
            <img src="/logo.png" alt="BaseParse Logo" className="w-8 h-8 relative z-10 filter drop-shadow-[0_0_8px_rgba(34,211,238,0.5)] group-hover:scale-110 transition-transform" />
            <div className="absolute inset-0 bg-cyan-400/20 blur-md rounded-full" />
          </div>
          <span className="font-pixel text-lg uppercase tracking-wider">BaseParse</span>
        </Link>
      </div>

      <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <div className="text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-4 px-2">Navigation Node</div>
        
        {navItems.filter((v,i,a)=>a.findIndex(v2=>(v2.name===v.name))===i).map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-sm transition-all relative group ${
                isActive 
                  ? "text-[#014b5c] dark:text-cyan-400 bg-[#014b5c]/10 dark:bg-cyan-400/10" 
                  : "hover:text-[#014b5c] dark:hover:text-cyan-400 hover:bg-[#014b5c]/5 dark:hover:bg-cyan-400/5 text-zinc-500 dark:text-zinc-400"
              }`}
            >
              {isActive && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute left-0 top-0 bottom-0 w-1 bg-[#014b5c] dark:bg-cyan-400"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <item.icon className={`w-4 h-4 ${isActive ? "opacity-100" : "opacity-70 group-hover:opacity-100"}`} />
              <span className="uppercase tracking-widest text-xs">{item.name}</span>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-zinc-200 dark:border-white/10 flex items-center justify-between">
        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="flex items-center gap-3 px-3 py-2 text-left rounded-sm hover:text-red-600 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-400/10 transition-colors uppercase tracking-widest text-xs disabled:opacity-50"
        >
          <LogOut className="w-4 h-4 opacity-70" />
          {isSigningOut ? "Disconnecting..." : "Disconnect"}
        </button>
        <ThemeToggle />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white font-sans flex overflow-hidden selection:bg-cyan-500/30">
      
      {/* Desktop Sidebar */}
      <div className="hidden md:block h-screen sticky top-0 z-50">
        <Sidebar />
      </div>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-zinc-50 dark:bg-[#050505] border-b border-zinc-200 dark:border-white/10 z-50 flex items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-black dark:text-white">
          <img src="/logo.png" alt="BaseParse Logo" className="w-5 h-5 filter drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]" />
          <span className="font-pixel text-sm uppercase tracking-wider">BaseParse</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button onClick={() => setMobileMenuOpen(true)} className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm z-50 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="fixed top-0 bottom-0 left-0 w-64 bg-zinc-50 dark:bg-black z-50 md:hidden"
            >
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="absolute top-4 right-4 p-2 text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white z-50"
              >
                <X className="w-6 h-6" />
              </button>
              <Sidebar />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative pt-16 md:pt-0">
        
        {/* Subtle grid background */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05] z-0" 
          style={{ 
            backgroundImage: `linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />

        {/* Top ambient glow */}
        <div className="absolute top-0 left-1/4 right-1/4 h-32 bg-cyan-500/10 blur-[100px] pointer-events-none z-0" />

        <div className="flex-1 overflow-y-auto overflow-x-hidden relative z-10 custom-scrollbar p-4 md:p-8">
          <TransitionWrapper>
            <div className="h-full w-full max-w-7xl mx-auto pb-12">
              {children}
            </div>
          </TransitionWrapper>
        </div>
      </main>
    </div>
  );
}
