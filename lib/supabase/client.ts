import { createBrowserClient } from "@supabase/ssr";
import { supabaseEnv } from "./env";

// Browser-side Supabase client for use in Client Components.
export function createSupabaseBrowserClient() {
  const { url, anonKey } = supabaseEnv();
  return createBrowserClient(url, anonKey);
}
