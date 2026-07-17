"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { authErrorKey } from "@/lib/auth/error-message";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";

export function SignupForm() {
  const t = useTranslations();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [communityId, setCommunityId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) return setError(t("validation.fullNameRequired"));
    if (password.length < 8) return setError(t("validation.passwordMin"));

    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: fullName.trim(),
          community_member_id: communityId.trim() || null,
        },
      },
    });

    if (error) {
      setError(t(`authErrors.${authErrorKey(error.message)}`));
      setLoading(false);
      return;
    }

    // Email confirmation on → no session yet. Otherwise go straight in.
    if (data.session) {
      router.push("/dashboard");
      router.refresh();
      return;
    }
    setEmailSent(true);
    setLoading(false);
  }

  if (emailSent) {
    return (
      <Alert tone="success" title={t("auth.checkEmailTitle")}>
        {t("auth.checkEmailBody")}
      </Alert>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error ? <Alert tone="error">{error}</Alert> : null}

      <Field label={t("auth.fullName")} htmlFor="fullName">
        <Input
          id="fullName"
          type="text"
          autoComplete="name"
          required
          placeholder={t("auth.fullNamePlaceholder")}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
      </Field>

      <Field label={t("auth.email")} htmlFor="email">
        <Input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          dir="ltr"
          placeholder={t("auth.emailPlaceholder")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>

      <Field label={t("auth.password")} htmlFor="password" hint={t("validation.passwordMin")}>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          dir="ltr"
          placeholder={t("auth.passwordPlaceholder")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>

      <Field
        label={t("auth.communityId")}
        htmlFor="communityId"
        optional={t("common.optional")}
      >
        <Input
          id="communityId"
          type="text"
          placeholder={t("auth.communityIdPlaceholder")}
          value={communityId}
          onChange={(e) => setCommunityId(e.target.value)}
        />
      </Field>

      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? t("auth.signingUp") : t("auth.signUpCta")}
      </Button>

      <p className="text-center text-sm text-ink-muted">
        {t("auth.haveAccount")}{" "}
        <Link href="/login" className="font-semibold text-brand-accent hover:underline">
          {t("auth.signInCta")}
        </Link>
      </p>
    </form>
  );
}
