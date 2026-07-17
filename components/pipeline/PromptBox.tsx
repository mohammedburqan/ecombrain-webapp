"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Copy, Check, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface PromptBoxProps {
  promptTemplate: string | null;
  productName: string;
  targetMarket: string | null;
}

function renderTemplate(
  template: string,
  productName: string,
  targetMarket: string | null,
): string {
  return template
    .replace(/\{\{product_name\}\}/g, productName)
    .replace(/\{\{target_market\}\}/g, targetMarket ?? "");
}

export function PromptBox({ promptTemplate, productName, targetMarket }: PromptBoxProps) {
  const t = useTranslations("pipeline");
  const [copied, setCopied] = useState(false);

  if (!promptTemplate) {
    return (
      <p className="rounded-xl border border-dashed border-line bg-canvas px-4 py-3 text-sm text-ink-muted">
        {t("promptEmpty")}
      </p>
    );
  }

  const rendered = renderTemplate(promptTemplate, productName, targetMarket);
  const claudeUrl = `https://claude.ai/new?q=${encodeURIComponent(rendered)}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(rendered);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available — silent fail
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-canvas">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <p className="text-sm font-medium text-ink-muted">{t("promptTitle")}</p>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              copied
                ? "bg-green-100 text-green-700"
                : "bg-surface text-ink-muted hover:text-ink border border-line",
            )}
          >
            {copied ? (
              <>
                <Check className="size-3.5" />
                {t("copied")}
              </>
            ) : (
              <>
                <Copy className="size-3.5" />
                {t("copyPrompt")}
              </>
            )}
          </button>
          <a
            href={claudeUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="primary" size="sm" className="gap-1.5">
              <ExternalLink className="size-3.5" />
              {t("openClaude")}
            </Button>
          </a>
        </div>
      </div>
      <pre
        dir="rtl"
        className="max-h-72 overflow-y-auto whitespace-pre-wrap break-words px-4 py-3 font-sans text-sm leading-relaxed text-ink"
      >
        {rendered}
      </pre>
    </div>
  );
}
