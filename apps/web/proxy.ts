import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Simple frontend auth bypass
  const hasFrontendAuth = request.cookies.has("frontend_auth");

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  // If there's an auth error like an invalid refresh token, we can just proceed as unauthenticated.
  if (error && error.message !== 'Auth session missing!') {
    // Supabase will have already cleared the invalid cookies via the setAll callback above.
    console.debug("Supabase auth error (e.g. invalid token):", error.message);
  }

  const isAuthRoute = request.nextUrl.pathname.startsWith("/login") || request.nextUrl.pathname.startsWith("/signup");
  const protectedPrefixes = [
    "/workspace", "/knowledge-base", "/databases",
    "/automation-studio", "/developer", "/admin"
  ];
  const isProtectedRoute = protectedPrefixes.some(prefix => 
    request.nextUrl.pathname.startsWith(prefix) && !request.nextUrl.pathname.startsWith("/api/")
  );

  const isAuthenticated = user || hasFrontendAuth;

  if (!isAuthenticated && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (isAuthenticated && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/workspace";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/inngest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
