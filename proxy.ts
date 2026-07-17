import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const AUTH_PATHS = ["/login", "/signup"];

function redirectTo(
  request: NextRequest,
  pathname: string,
  cookieSource: NextResponse,
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  const response = NextResponse.redirect(url);
  // Carry over any refreshed auth cookies so the session isn't dropped.
  cookieSource.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
  return response;
}

export async function proxy(request: NextRequest) {
  const { supabase, supabaseResponse, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Protect the dashboard.
  if (pathname.startsWith("/dashboard") && !user) {
    return redirectTo(request, "/login", supabaseResponse);
  }

  // Admin-only area.
  if (pathname.startsWith("/dashboard/admin") && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return redirectTo(request, "/dashboard", supabaseResponse);
    }
  }

  // Keep signed-in users out of the auth pages.
  if (user && AUTH_PATHS.includes(pathname)) {
    return redirectTo(request, "/dashboard", supabaseResponse);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Run on everything except static assets and image files.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
