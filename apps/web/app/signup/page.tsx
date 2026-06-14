"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useScroll } from "framer-motion";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { ArrowRight, Mail, Lock, User, Loader2, Tag } from "lucide-react";
import { KnowledgeCore } from "../../components/ui/KnowledgeCore";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [userRole, setUserRole] = useState("student");
  const [socialUrl, setSocialUrl] = useState("");
  const [country, setCountry] = useState("United States");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Static knowledge core for signup page
  const { scrollYProgress } = useScroll();

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
          full_name: fullName,
          user_role: userRole,
          social_url: socialUrl,
          country: country,
        },
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      }
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.user && data.user.identities && data.user.identities.length === 0) {
       setError("An account with this email already exists.");
       setLoading(false);
       return;
    }

    if (referralCode && data.user) {
        const { createClient } = await import('@supabase/supabase-js');
        const adminSupabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
        await adminSupabase.from('profiles').update({ referred_by: referralCode }).eq('id', data.user.id);
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

  return (
    <div className="min-h-screen bg-[#020202] flex relative overflow-hidden py-12 overflow-y-auto font-sans">
      
      {/* Central Background Object (Static Mode) */}
      <KnowledgeCore scrollYProgress={scrollYProgress} isStatic={true} />

      <div className="flex-1 flex flex-col justify-center items-center p-6 z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg"
        >
          <div className="flex items-center justify-center gap-3 mb-8">
            <img src="/logo.png" alt="GenWorkAI" className="w-10 h-10 rounded-xl shadow-[0_0_20px_rgba(139,92,246,0.3)]" />
            <span className="text-3xl font-bold text-white tracking-tight drop-shadow-md">GenWork<span className="text-violet-500">AI</span></span>
          </div>

          <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-white mb-2">Create an account</h1>
              <p className="text-sm text-zinc-400">Join the AI OS revolution today.</p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-violet-500/10 border border-violet-500/20 text-sm text-violet-400 text-center font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleEmailSignup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input 
                    type="text" 
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all text-white placeholder-zinc-600"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all text-white placeholder-zinc-600"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input 
                    type="password" 
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all text-white placeholder-zinc-600"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">Country</label>
                  <select 
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0a0a0c] border border-white/10 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all text-white"
                  >
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="India">India</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">I am a...</label>
                  <select 
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0a0a0c] border border-white/10 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all text-white"
                  >
                    <option value="student">Student</option>
                    <option value="working_professional">Working Professional</option>
                    <option value="freelancer">Freelancer</option>
                    <option value="influencer">Influencer</option>
                    <option value="freebird">Freebird</option>
                  </select>
                </div>
              </div>

              {userRole === "influencer" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">YouTube/Instagram URL</label>
                  <input 
                    type="url" 
                    value={socialUrl}
                    onChange={(e) => setSocialUrl(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all text-white placeholder-zinc-600"
                    placeholder="https://youtube.com/..."
                  />
                </motion.div>
              )}

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Referral Code (Optional)</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input 
                    type="text" 
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all text-white placeholder-zinc-600 uppercase"
                    placeholder="CODE123"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-white hover:bg-zinc-200 text-black py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-6 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Create Account <ArrowRight className="w-5 h-5" /></>}
              </button>
            </form>

            <div className="mt-6 flex items-center gap-4">
              <div className="flex-1 h-px bg-white/10"></div>
              <span className="text-xs text-zinc-500">OR</span>
              <div className="flex-1 h-px bg-white/10"></div>
            </div>

            <button 
              onClick={handleGithubSignup}
              className="w-full mt-6 bg-white/5 border border-white/10 hover:bg-white/10 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all"
            >
              Sign up with GitHub
            </button>

            <p className="text-center mt-8 text-sm text-zinc-400">
              Already have an account? <Link href="/login" className="font-semibold text-violet-400 hover:text-violet-300 transition-colors">Sign in</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
