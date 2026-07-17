"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { brandInputSchema } from "./validation";

export interface BrandFormState {
  error?: string;
  fieldErrors?: {
    name?: string;
    product_name?: string;
    target_market?: string;
  };
}

// Creates a brand owned by the current user. A DB trigger then seeds the 15
// step-progress rows (step 1 unlocked, rest locked) — gating is not trusted to
// the client. On success, redirects to the new brand's workspace.
export async function createBrandAction(
  _prev: BrandFormState,
  formData: FormData,
): Promise<BrandFormState> {
  const t = await getTranslations("validation");
  const tc = await getTranslations("common");

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const parsed = brandInputSchema.safeParse({
    name: formData.get("name"),
    product_name: formData.get("product_name"),
    target_market: formData.get("target_market"),
  });

  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    return {
      fieldErrors: {
        name: flat.name ? t("nameRequired") : undefined,
        product_name: flat.product_name ? t("productRequired") : undefined,
        target_market: flat.target_market ? t("marketRequired") : undefined,
      },
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("brands")
    .insert({ ...parsed.data, owner_id: user.id })
    .select("id")
    .single();

  if (error || !data) {
    return { error: tc("error") };
  }

  revalidatePath("/dashboard/brands");
  revalidatePath("/dashboard");
  redirect(`/dashboard/brands/${data.id}`);
}

// Archives (kills) a brand the current user owns.
export async function archiveBrandAction(formData: FormData): Promise<void> {
  const brandId = String(formData.get("brandId") ?? "");
  if (!brandId) return;

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createSupabaseServerClient();
  await supabase.from("brands").update({ status: "killed" }).eq("id", brandId);

  revalidatePath("/dashboard/brands");
  revalidatePath(`/dashboard/brands/${brandId}`);
  revalidatePath("/dashboard");
}
