import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { db } from '@/db';
import { profiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { AdminSidebar } from '@/components/layout/admin-sidebar';

export const metadata = {
  title: "Admin Control | GenWorkAI",
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
    <div className="flex h-screen bg-zinc-50 dark:bg-[#0A0A0B] text-foreground">
      <AdminSidebar />
      <div className="flex flex-1 flex-col overflow-hidden transition-colors">
        <main className="flex-1 flex flex-col overflow-hidden p-6 relative">
          <div className="absolute inset-0 overflow-y-auto">
            <div className="min-h-full max-w-7xl mx-auto p-4 md:p-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
