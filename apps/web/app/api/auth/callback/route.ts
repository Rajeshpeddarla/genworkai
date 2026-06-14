import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "../../../../db";
import { profiles } from "../../../../db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch (error) {
              // Ignore if called from a server component
            }
          },
        },
      }
    );

    const { error, data } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data.user) {
      // Create profile if it doesn't exist
      try {
        const existingProfile = await db.select().from(profiles).where(eq(profiles.id, data.user.id)).limit(1);
        if (existingProfile.length === 0) {
          // Generate a simple random referral code
          const referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
          
          await db.insert(profiles).values({
            id: data.user.id,
            email: data.user.email || '',
            fullName: data.user.user_metadata?.full_name || '',
            avatarUrl: data.user.user_metadata?.avatar_url || '',
            referralCode,
            userRole: data.user.user_metadata?.user_role || 'freebird',
            socialUrl: data.user.user_metadata?.social_url || '',
            country: data.user.user_metadata?.country || 'Unknown',
          });
        }
      } catch (dbError) {
        console.error("Error ensuring profile exists:", dbError);
        // Supabase REST client fallback in case Drizzle fails locally
        const { createClient } = await import('@supabase/supabase-js');
        const adminSupabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
        const { data: profileCheck } = await adminSupabase.from('profiles').select('id').eq('id', data.user.id).single();
        if (!profileCheck) {
           const referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
           await adminSupabase.from('profiles').insert({
             id: data.user.id,
             email: data.user.email || '',
             full_name: data.user.user_metadata?.full_name || '',
             avatar_url: data.user.user_metadata?.avatar_url || '',
             referral_code: referralCode,
             user_role: data.user.user_metadata?.user_role || 'freebird',
             social_url: data.user.user_metadata?.social_url || '',
             country: data.user.user_metadata?.country || 'Unknown',
           });
        }
      }

      return NextResponse.redirect(`${requestUrl.origin}${next}`);
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${requestUrl.origin}/login?error=Invalid auth code`);
}
