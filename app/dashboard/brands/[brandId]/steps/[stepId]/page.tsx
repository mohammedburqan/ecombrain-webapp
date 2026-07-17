import { notFound } from "next/navigation";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowRight, Lock } from "lucide-react";
import { getStepWithContext } from "@/lib/brands/queries";
import { CHECKBOX_STEP_KEYS } from "@/lib/pipeline/steps";
import { VideoEmbed } from "@/components/pipeline/VideoEmbed";
import { PromptBox } from "@/components/pipeline/PromptBox";
import { RequiredInputs } from "@/components/pipeline/RequiredInputs";
import { UploadZone } from "@/components/pipeline/UploadZone";
import { StepStatusBadge } from "@/components/pipeline/StepStatusBadge";
import { buttonClasses } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";

export default async function StepDetailPage({
  params,
}: {
  params: Promise<{ brandId: string; stepId: string }>;
}) {
  const { brandId, stepId: stepIdStr } = await params;
  const stepId = parseInt(stepIdStr, 10);
  if (isNaN(stepId)) notFound();

  const t = await getTranslations();
  const locale = await getLocale();
  const ctx = await getStepWithContext(brandId, stepId);

  if (!ctx) notFound();

  const { brand, step, prerequisiteFiles } = ctx;
  const status = step.progress.status;
  const locked = status === "locked";

  // Render step name / description based on locale.
  const stepName = locale === "ar" ? step.name_ar : step.name_en;
  const stepDescription =
    locale === "ar"
      ? (step.description_ar ?? null)
      : ((step as unknown as { description_en?: string }).description_en ?? null);

  const isCheckboxStep = CHECKBOX_STEP_KEYS.has(step.step_key);
  const allowedTypes = (step.output_file_types as string[]).filter(
    (t) => t !== "checkbox",
  );

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-2 text-sm text-ink-muted">
        <Link
          href={`/dashboard/brands/${brand.id}`}
          className="hover:text-ink transition-colors"
        >
          {brand.name}
        </Link>
        <ArrowRight className="size-3.5 rotate-180 rtl:rotate-0" />
        <span className="text-ink font-medium">{stepName}</span>
      </div>

      {/* Step header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-ink-muted">
            {t("pipeline.stepOf", { number: step.sort_order, total: 15 })}
            {step.is_repeatable ? (
              <span className="ms-2 rounded-full bg-brand-purple/10 px-2 py-0.5 text-[11px] font-medium text-brand-accent">
                {t("pipeline.repeatable")}
              </span>
            ) : null}
          </p>
          <h1 className="mt-1 text-2xl font-extrabold text-ink">{stepName}</h1>
          {stepDescription ? (
            <p className="mt-1 text-sm text-ink-muted">{stepDescription}</p>
          ) : null}
        </div>
        <StepStatusBadge status={status} />
      </div>

      {/* Locked state */}
      {locked ? (
        <Card>
          <CardBody className="flex flex-col items-center gap-4 py-10 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-canvas border border-line">
              <Lock className="size-6 text-ink-muted" />
            </div>
            <div>
              <p className="font-bold text-ink">{t("pipeline.stepLockedTitle")}</p>
              <p className="mt-1 text-sm text-ink-muted">{t("pipeline.stepLockedHint")}</p>
            </div>
            <Link
              href={`/dashboard/brands/${brand.id}`}
              className={buttonClasses("secondary", "sm")}
            >
              {t("pipeline.backToRoadmap")}
            </Link>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Instructional video */}
          <section>
            <h2 className="mb-3 text-sm font-semibold text-ink">
              {t("pipeline.videoTitle")}
            </h2>
            <VideoEmbed videoUrl={step.video_url} />
          </section>

          {/* Required inputs + MCPs */}
          {(prerequisiteFiles.length > 0 ||
            (step.required_mcps as string[]).length > 0) && (
            <section>
              <RequiredInputs
                prerequisiteFiles={prerequisiteFiles}
                brandId={brand.id}
                requiredMcps={step.required_mcps as string[]}
              />
            </section>
          )}

          {/* Prompt box */}
          {step.prompt_template ? (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-ink">
                {t("pipeline.promptTitle")}
              </h2>
              <PromptBox
                promptTemplate={step.prompt_template}
                productName={brand.product_name}
                targetMarket={brand.target_market}
              />
            </section>
          ) : null}

          {/* Upload / confirm zone */}
          <section>
            <h2 className="mb-3 text-sm font-semibold text-ink">
              {isCheckboxStep ? t("pipeline.confirmTitle") : t("pipeline.uploadTitle")}
            </h2>
            <p className="mb-4 text-sm text-ink-muted">
              {isCheckboxStep
                ? t("pipeline.confirmSubtitle")
                : t("pipeline.uploadSubtitle")}
            </p>
            <UploadZone
              brandId={brand.id}
              stepId={step.id}
              allowedTypes={allowedTypes}
              isCheckboxStep={isCheckboxStep}
              isApproved={status === "approved"}
              isRepeatable={step.is_repeatable}
            />
          </section>

          {/* Back link */}
          <div className="pt-2">
            <Link
              href={`/dashboard/brands/${brand.id}`}
              className={buttonClasses("ghost", "sm")}
            >
              {t("pipeline.backToRoadmap")}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
