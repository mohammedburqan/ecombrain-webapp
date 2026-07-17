"use client";

import { useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Upload, CheckCircle, AlertCircle, File } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { submitStepAction } from "@/lib/pipeline/actions";

interface UploadZoneProps {
  brandId: string;
  stepId: number;
  allowedTypes: string[]; // non-checkbox types from output_file_types
  isCheckboxStep: boolean;
  isApproved: boolean;
  isRepeatable: boolean;
}

export function UploadZone({
  brandId,
  stepId,
  allowedTypes,
  isCheckboxStep,
  isApproved,
  isRepeatable,
}: UploadZoneProps) {
  const t = useTranslations("pipeline");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [result, setResult] = useState<"success" | "error" | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  // For already-approved non-repeatable steps, show a "done" state.
  if (isApproved && !isRepeatable) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
        <CheckCircle className="size-5 shrink-0 text-green-600" />
        <p className="text-sm font-medium text-green-700">
          {t("confirmSuccess")}
        </p>
      </div>
    );
  }

  const fileTypes = allowedTypes.filter((t) => t !== "checkbox");
  const typesLabel = fileTypes.map((t) => `.${t}`).join(", ");
  const accept = fileTypes.map((t) => `.${t}`).join(",");

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) setSelectedFile(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isCheckboxStep && !selectedFile) return;
    if (isCheckboxStep && !confirmed && !selectedFile) return;

    setResult(null);
    setErrorMsg("");

    const formData = new FormData();
    formData.set("brandId", brandId);
    formData.set("stepId", String(stepId));
    if (selectedFile) formData.set("file", selectedFile);
    if (confirmed) formData.set("confirmed", "true");

    startTransition(async () => {
      const res = await submitStepAction(formData);
      if (res.ok) {
        setResult("success");
        setSelectedFile(null);
        setConfirmed(false);
        router.refresh();
      } else {
        setResult("error");
        const msgKey =
          res.error === "wrong_file_type"
            ? t("wrongFileType", { types: typesLabel })
            : res.error === "file_too_large"
              ? t("fileTooLarge")
              : res.error === "step_locked"
                ? t("stepLockedTitle")
                : t("uploadError");
        setErrorMsg(msgKey);
      }
    });
  }

  const canSubmit = isPending
    ? false
    : isCheckboxStep
      ? confirmed || !!selectedFile
      : !!selectedFile;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Success / error banners */}
      {result === "success" && (
        <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
          <CheckCircle className="size-5 shrink-0 text-green-600" />
          <p className="text-sm font-medium text-green-700">{t("uploadSuccess")}</p>
        </div>
      )}
      {result === "error" && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <AlertCircle className="size-5 shrink-0 text-red-600" />
          <p className="text-sm font-medium text-red-700">{errorMsg}</p>
        </div>
      )}

      {/* Checkbox confirm (for checkbox steps) */}
      {isCheckboxStep && (
        <div className="space-y-3 rounded-xl border border-line bg-canvas p-4">
          <p className="text-sm font-medium text-ink">{t("confirmTitle")}</p>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 size-4 cursor-pointer accent-brand-accent"
            />
            <span className="text-sm text-ink">{t("confirmCheckboxLabel")}</span>
          </label>
        </div>
      )}

      {/* File upload area */}
      <div>
        {isCheckboxStep && (
          <p className="mb-2 text-sm font-medium text-ink-muted">
            {t("fileOptional")}
          </p>
        )}
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-colors",
            dragging
              ? "border-brand-accent bg-brand-purple/5"
              : "border-line bg-canvas hover:border-brand-accent/50 hover:bg-brand-purple/5",
          )}
        >
          {selectedFile ? (
            <>
              <File className="size-8 text-brand-accent" />
              <p className="text-sm font-medium text-ink">{selectedFile.name}</p>
              <p className="text-xs text-ink-muted">
                {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
              </p>
            </>
          ) : (
            <>
              <Upload className="size-8 text-ink-muted" />
              <div>
                <p className="text-sm font-medium text-ink">{t("dragDropHere")}</p>
                <p className="mt-0.5 text-xs text-ink-muted">{t("orBrowse")}</p>
              </div>
              {typesLabel ? (
                <p className="text-xs text-ink-muted">
                  {t("allowedTypes", { types: typesLabel })}
                </p>
              ) : null}
            </>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={accept || undefined}
          className="sr-only"
          onChange={handleFileChange}
          tabIndex={-1}
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        disabled={!canSubmit}
      >
        {isPending
          ? isCheckboxStep
            ? t("confirming")
            : t("uploading")
          : isCheckboxStep
            ? t("confirmCta")
            : t("uploadCta")}
      </Button>
    </form>
  );
}
