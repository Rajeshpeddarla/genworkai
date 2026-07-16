"use client";

import { useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, Lock, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signInError, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      router.push("/dashboard");
      router.refresh();
    }
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col selection:bg-cyan-500/30">
      
      {/* Intense Volumetric Corner Glows */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-50 mix-blend-screen">
        <div className="absolute -top-[20vh] -left-[20vw] w-[50vw] h-[50vh] bg-violet-600/20 blur-[150px] rounded-full" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        
        <div className="w-full max-w-md">
          <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-cyan-400 font-mono text-xs uppercase tracking-widest mb-12 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Return to Terminal
          </Link>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-white/10 bg-black/80 backdrop-blur-xl p-10 shadow-[0_0_50px_rgba(139,92,246,0.05)] relative overflow-hidden"
          >
            {/* Top scanning line effect */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-violet-500 to-transparent opacity-50" />
            
            <div className="mb-10 text-center">
              <div className="flex justify-center mb-6">
                <img src="/logo.png" alt="BaseParse Logo" className="w-16 h-16 object-contain" />
              </div>
              <h1 className="font-pixel text-3xl text-white mb-2 uppercase">Authenticate Node</h1>
              <p className="font-mono text-xs text-zinc-500 uppercase tracking-widest">Access secure terminal</p>
            </div>

            {error && (
              <div className="mb-6 p-4 border border-red-500/30 bg-red-500/10 text-sm text-red-400 font-mono">
                [ERR] {error}
              </div>
            )}

            <form onSubmit={handleEmailLogin} className="space-y-6 font-mono text-sm">
              <div>
                <label className="block text-violet-400 mb-2 uppercase tracking-widest text-xs">Identity (Email)</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-[#050505] border border-white/10 focus:border-violet-500 outline-none transition-colors text-white placeholder-zinc-700"
                    placeholder="user@system.local"
                  />
                </div>
              </div>

              <div>
                <label className="block text-violet-400 mb-2 uppercase tracking-widest text-xs">Passphrase</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-[#050505] border border-white/10 focus:border-violet-500 outline-none transition-colors text-white placeholder-zinc-700"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-white hover:bg-violet-400 text-black py-4 font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 uppercase tracking-widest"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Initiate Handshake"}
              </button>
            </form>

            <div className="my-8 flex items-center gap-4">
              <div className="h-[1px] flex-1 bg-white/10" />
              <div className="font-mono text-xs text-zinc-600 uppercase tracking-widest">OR OAUTH</div>
              <div className="h-[1px] flex-1 bg-white/10" />
            </div>

            <div className="space-y-4">
              <button 
                onClick={handleGoogleLogin}
                className="w-full bg-[#050505] border border-white/10 hover:border-white/30 text-white py-4 font-mono text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google SSO
              </button>
            </div>
            
            <div className="mt-8 text-center font-mono text-xs text-zinc-500">
              New to BaseParse?{' '}
              <Link href="/signup" className="text-violet-400 hover:text-white transition-colors uppercase tracking-widest font-bold">
                Deploy Node
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
