import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseEnv } from "@/lib/supabase/env";

// Signs the user out and clears the session cookies on the redirect response.
export async function POST(request: NextRequest) {
  const { origin } = new URL(request.url);
  const { url, anonKey } = supabaseEnv();
  const response = NextResponse.redirect(`${origin}/login`, { status: 303 });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  await supabase.auth.signOut();
  return response;
}
