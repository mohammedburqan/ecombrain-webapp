import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export interface SessionUser {
  id: string;
  email: string | null;
  profile: Profile;
}

// Returns the signed-in user together with their profile row, or null.
// Falls back to creating a profile if the signup trigger hasn't run yet.
export async function getCurrentUser(): Promise<SessionUser | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profile) {
    return { id: user.id, email: user.email ?? null, profile: profile as Profile };
  }

  // Fallback: ensure a profile exists (always as a student — role escalation
  // is blocked by RLS + trigger).
  const { data: created } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      full_name:
        (user.user_metadata?.full_name as string | undefined) ??
        (user.user_metadata?.name as string | undefined) ??
        null,
      role: "student",
    })
    .select()
    .single();

  const fallback: Profile =
    (created as Profile | null) ?? {
      id: user.id,
      full_name: null,
      role: "student",
      community_member_id: null,
      created_at: new Date().toISOString(),
    };

  return { id: user.id, email: user.email ?? null, profile: fallback };
}

// For Server Components / Server Actions: redirects to /login if unauthenticated.
export async function requireAuth(): Promise<SessionUser> {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  return current;
}

// For Server Components: redirects non-admins away.
export async function requireAdmin(): Promise<SessionUser> {
  const current = await requireAuth();
  if (current.profile.role !== "admin") redirect("/dashboard");
  return current;
}
