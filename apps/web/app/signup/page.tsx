"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useScroll } from "framer-motion";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { ArrowRight, Mail, Lock, User, Loader2, Tag, BrainCircuit, ArrowLeft, Database, Terminal, Shield, Zap } from "lucide-react";
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
      if (data.user) {
        const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', data.user.id).single();
        if (profile?.is_admin) {
          router.push("/admin");
        } else {
          router.push("/workspace");
        }
      } else {
        router.push("/workspace");
      }
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
    <div className="min-h-screen bg-[#020202] flex flex-col md:flex-row font-sans">
      
      {/* Left Column: Visuals & Context */}
      <div className="hidden md:flex md:w-1/2 lg:w-5/12 bg-card border-r border-white/10 relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 z-0">
          <KnowledgeCore scrollYProgress={scrollYProgress} isStatic={true} />
        </div>
        
        {/* Dark overlay to ensure text is readable over the 3D model */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/90 z-0 pointer-events-none" />

        <div className="relative z-10">
          <div className="mb-16">
            <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </Link>
          </div>
          
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">GenWork<span className="text-violet-500">AI</span></span>
          </div>

          <h1 className="text-4xl font-bold mb-6 text-white leading-tight">
            Start building with <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">Application-Ready Intelligence</span>.
          </h1>
          <p className="text-zinc-400 max-w-md">
            Join the platform that turns repositories, databases, and business knowledge into APIs and MCP servers.
          </p>
        </div>

        <div className="relative z-10 space-y-6 mt-20">
          <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-white font-medium">Fast & Seamless</h3>
              <p className="text-zinc-400 text-sm">Deploy automated workflows in minutes.</p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md">
            <div className="p-3 bg-fuchsia-500/20 text-fuchsia-400 rounded-xl">
              <Terminal className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-white font-medium">Developer First</h3>
              <p className="text-zinc-400 text-sm">Rich API and direct integration with your tools.</p>
            </div>
          </div>
        </div>
        
        <div className="relative z-10 mt-12 pt-8 border-t border-white/10 flex items-center gap-3 text-sm text-zinc-500">
           <Shield className="w-4 h-4" /> Trusted by engineering teams worldwide.
        </div>
      </div>

      {/* Right Column: Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative z-10 bg-[#020202]">
        
        <Link href="/" className="md:hidden absolute top-6 left-6 inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="md:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <span className="text-3xl font-bold text-white tracking-tight">GenWork<span className="text-violet-500">AI</span></span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl max-h-[85vh] overflow-y-auto custom-scrollbar">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-white mb-2">Create an account</h1>
              <p className="text-sm text-zinc-400">Join the AI OS revolution today.</p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 text-center font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleEmailSignup} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input 
                    type="text" 
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-black/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all text-white placeholder-zinc-600"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-black/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all text-white placeholder-zinc-600"
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
                    className="w-full pl-10 pr-4 py-3 bg-black/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all text-white placeholder-zinc-600"
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
                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all text-white appearance-none"
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
                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all text-white appearance-none"
                  >
                    <option value="student">Student</option>
                    <option value="working_professional">Professional</option>
                    <option value="freelancer">Freelancer</option>
                    <option value="influencer">Influencer</option>
                    <option value="freebird">Freebird</option>
                  </select>
                </div>
              </div>

              {userRole === "influencer" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">Social URL</label>
                  <input 
                    type="url" 
                    value={socialUrl}
                    onChange={(e) => setSocialUrl(e.target.value)}
                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all text-white placeholder-zinc-600"
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
                    className="w-full pl-10 pr-4 py-3 bg-black/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all text-white placeholder-zinc-600 uppercase"
                    placeholder="CODE123"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-white hover:bg-zinc-200 text-black py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 mt-4"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Create Account <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>

            <div className="mt-8 flex items-center gap-4">
              <div className="flex-1 h-px bg-white/10"></div>
              <span className="text-xs text-zinc-500 font-medium">OR CONTINUE WITH</span>
              <div className="flex-1 h-px bg-white/10"></div>
            </div>

            <button 
              onClick={handleGithubSignup}
              className="w-full mt-8 bg-card border border-white/10 hover:bg-zinc-800 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-3 transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              GitHub
            </button>

            <p className="text-center mt-8 text-sm text-zinc-400">
              Already have an account? <Link href="/login" className="font-semibold text-white hover:text-violet-400 transition-colors">Sign in</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
