import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicEnv, isPreviewMode, isSupabaseConfigured } from "@/lib/supabase/env";

const PUBLIC_PATHS = ["/sign-in", "/sign-up"];

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  return pathname === "/auth" || pathname.startsWith("/auth/");
}

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie);
  });
  return to;
}

export async function updateSession(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // nginx and the compose healthcheck call /health with no session.
  if (pathname === "/health") {
    return NextResponse.next({ request });
  }

  if (isPreviewMode()) {
    return NextResponse.next({ request });
  }

  if (!isSupabaseConfigured()) {
    if (isPublicPath(pathname)) {
      return NextResponse.next({ request });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.search = "";
    return NextResponse.redirect(url);
  }

  let supabaseResponse = NextResponse.next({ request });
  const env = getSupabasePublicEnv();
  if (!env) {
    return supabaseResponse;
  }

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    const next = `${pathname}${search}`;
    url.search = next && next !== "/" ? `?next=${encodeURIComponent(next)}` : "";
    return copyCookies(supabaseResponse, NextResponse.redirect(url));
  }

  if (user && (pathname === "/sign-in" || pathname === "/sign-up" || pathname === "/")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return copyCookies(supabaseResponse, NextResponse.redirect(url));
  }

  return supabaseResponse;
}
