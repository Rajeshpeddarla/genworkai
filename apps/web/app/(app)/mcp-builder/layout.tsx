import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUserProfile } from "@/lib/limits";

export default async function McpBuilderLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const profile = await getUserProfile(user.id);
  if (!profile || profile.tier !== "pro") {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center bg-[#050505]">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-12 max-w-lg shadow-2xl backdrop-blur-xl">
          <div className="w-16 h-16 bg-violet-500/20 rounded-full flex items-center justify-center text-violet-400 mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Pro Feature Locked</h2>
          <p className="text-zinc-400 mb-8 leading-relaxed">
            MCP Server Deployment is exclusive to Pro tier users. Upgrade to unlock direct AI agent integration with your business knowledge.
          </p>
          <a href="/dashboard/settings" className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:shadow-violet-500/25 transition-all">
            Upgrade to Pro
          </a>
        </div>
      </div>
    );
  }

  return children;
}
