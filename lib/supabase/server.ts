import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { supabaseEnv } from "./env";

// Supabase client bound to the current request's cookies. Use in Server
// Components, Server Actions, and Route Handlers. Respects RLS as the signed-in
// user.
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = supabaseEnv();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // `setAll` was called from a Server Component where cookies are
          // read-only. The middleware refreshes the session cookie instead,
          // so this is safe to ignore.
        }
      },
    },
  });
}

// Service-role client that BYPASSES RLS. Server-only. Never expose the service
// role key to the browser. Use for trusted server-side gating in later phases.
export function createSupabaseServiceRoleClient() {
  const { url } = supabaseEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY. See .env.local.example (server-only).",
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
