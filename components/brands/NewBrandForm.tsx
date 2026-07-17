"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { createBrandAction, type BrandFormState } from "@/lib/brands/actions";
import { Field, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

const initialState: BrandFormState = {};

export function NewBrandForm() {
  const t = useTranslations();
  const [state, action, pending] = useActionState(
    createBrandAction,
    initialState,
  );

  return (
    <form action={action} className="space-y-4">
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}

      <Field
        label={t("brands.nameLabel")}
        htmlFor="name"
        error={state.fieldErrors?.name}
      >
        <Input
          id="name"
          name="name"
          required
          maxLength={120}
          placeholder={t("brands.namePlaceholder")}
        />
      </Field>

      <Field
        label={t("brands.productLabel")}
        htmlFor="product_name"
        error={state.fieldErrors?.product_name}
      >
        <Input
          id="product_name"
          name="product_name"
          required
          maxLength={120}
          placeholder={t("brands.productPlaceholder")}
        />
      </Field>

      <Field
        label={t("brands.marketLabel")}
        htmlFor="target_market"
        error={state.fieldErrors?.target_market}
      >
        <Input
          id="target_market"
          name="target_market"
          required
          maxLength={120}
          placeholder={t("brands.marketPlaceholder")}
        />
      </Field>

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? t("brands.creating") : t("brands.createCta")}
      </Button>
    </form>
  );
}
