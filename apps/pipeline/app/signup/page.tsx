"use client";

import { useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { ArrowRight, Mail, Lock, Loader2, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signUpError, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          source: 'baseparse',
        },
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      }
    });

    if (signUpError) {
      if (signUpError.message === "User already registered") {
         setError("An account with this email already exists on GenWorkAI or BaseParse.");
      } else {
         setError(signUpError.message);
      }
      setLoading(false);
      return;
    }

    if (data.user && data.user.identities && data.user.identities.length === 0) {
       setError("An account with this email already exists on GenWorkAI or BaseParse.");
       setLoading(false);
       return;
    }

    if (data.session) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setError("Please check your email to confirm your account.");
      setLoading(false);
    }
  };

  const handleGithubSignup = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
  };

  const handleGoogleSignup = async () => {
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
        <div className="absolute -top-[20vh] -left-[20vw] w-[50vw] h-[50vh] bg-cyan-600/20 blur-[150px] rounded-full" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        
        <div className="w-full max-w-md">
          <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-cyan-400 font-mono text-xs uppercase tracking-widest mb-12 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Return to Terminal
          </Link>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-white/10 bg-black/80 backdrop-blur-xl p-10 shadow-[0_0_50px_rgba(34,211,238,0.05)] relative overflow-hidden"
          >
            {/* Top scanning line effect */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />
            
            <div className="mb-10 text-center">
              <div className="flex justify-center mb-6">
                <img src="/logo.png" alt="BaseParse Logo" className="w-16 h-16 object-contain" />
              </div>
              <h1 className="font-pixel text-3xl text-white mb-2 uppercase">Deploy Node</h1>
              <p className="font-mono text-xs text-zinc-500 uppercase tracking-widest">Create secure account</p>
            </div>

            {error && (
              <div className="mb-6 p-4 border border-red-500/30 bg-red-500/10 text-sm text-red-400 font-mono flex flex-col gap-2">
                <div>[ERR] {error}</div>
                {error.includes("already exists") && (
                  <Link href="/login" className="text-white hover:text-cyan-400 underline underline-offset-4 decoration-white/30 transition-colors">
                    Click here to authenticate instead.
                  </Link>
                )}
              </div>
            )}

            <form onSubmit={handleEmailSignup} className="space-y-6 font-mono text-sm">
              <div>
                <label className="block text-cyan-500 mb-2 uppercase tracking-widest text-xs">Identity (Email)</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-[#050505] border border-white/10 focus:border-cyan-500 outline-none transition-colors text-white placeholder-zinc-700"
                    placeholder="user@system.local"
                  />
                </div>
              </div>

              <div>
                <label className="block text-cyan-500 mb-2 uppercase tracking-widest text-xs">Passphrase</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                  <input 
                    type="password" 
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-[#050505] border border-white/10 focus:border-cyan-500 outline-none transition-colors text-white placeholder-zinc-700"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-white hover:bg-cyan-400 text-black py-4 font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 uppercase tracking-widest"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Initialize Node <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>

            <div className="mt-8 mb-8 flex items-center gap-4">
              <div className="flex-1 h-[1px] bg-white/10"></div>
              <span className="text-[10px] text-zinc-600 font-mono uppercase tracking-[0.2em]">External Providers</span>
              <div className="flex-1 h-[1px] bg-white/10"></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={handleGithubSignup}
                className="w-full bg-[#050505] border border-white/10 hover:border-white/30 text-white py-3 font-mono text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                GitHub
              </button>
              <button 
                onClick={handleGoogleSignup}
                className="w-full bg-[#050505] border border-white/10 hover:border-white/30 text-white py-3 font-mono text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/><path fill="none" d="M1 1h22v22H1z"/></svg>
                Google
              </button>
            </div>

            <div className="mt-8 text-center font-mono text-xs text-zinc-500">
              Already have a GenWorkAI or BaseParse node?{' '}
              <Link href="/login" className="text-cyan-400 hover:text-white transition-colors uppercase tracking-widest font-bold">
                Authenticate
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
