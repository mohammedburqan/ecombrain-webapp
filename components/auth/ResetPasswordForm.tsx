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

export function ResetPasswordForm() {
  const t = useTranslations();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError(t("validation.passwordMin"));
    if (password !== confirm) return setError(t("validation.passwordMatch"));

    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(t(`authErrors.${authErrorKey(error.message)}`));
      setLoading(false);
      return;
    }
    setDone(true);
    setLoading(false);
    // Give a moment for the confirmation, then send to dashboard.
    router.refresh();
  }

  if (done) {
    return (
      <div className="space-y-4">
        <Alert tone="success" title={t("auth.passwordUpdatedTitle")}>
          {t("auth.passwordUpdatedBody")}
        </Alert>
        <Link
          href="/dashboard"
          className="block text-center text-sm font-semibold text-brand-accent hover:underline"
        >
          {t("nav.dashboard")}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error ? <Alert tone="error">{error}</Alert> : null}

      <Field label={t("auth.newPassword")} htmlFor="password">
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

      <Field label={t("auth.confirmPassword")} htmlFor="confirm">
        <Input
          id="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          dir="ltr"
          placeholder={t("auth.passwordPlaceholder")}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </Field>

      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? t("auth.updating") : t("auth.updatePassword")}
      </Button>
    </form>
  );
}
