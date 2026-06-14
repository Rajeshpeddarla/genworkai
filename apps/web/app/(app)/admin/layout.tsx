import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { db } from '@/db';
import { profiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { Sidebar } from '@/components/layout/sidebar';

export const metadata = {
  title: "Admin Panel | GenWorkAI",
  description: "Enterprise administration and system configuration for GenWorkAI.",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
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
  if (!user) redirect('/login');

  const profileReq = await db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1);
  const profile = profileReq[0];

  if (!profile || !profile.isAdmin) {
    redirect('/dashboard');
  }

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto w-full relative pt-20 lg:pt-0">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Enterprise Administration</h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">Manage users, system configurations, limits, and promotions.</p>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
