"use client";

import { useTranslations } from "next-intl";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import type { BrandStatus } from "@/types/database";

const MAP: Record<BrandStatus, { tone: BadgeTone; key: string }> = {
  active: { tone: "green", key: "statusActive" },
  killed: { tone: "neutral", key: "statusKilled" },
  launched: { tone: "blue", key: "statusLaunched" },
};

export function BrandStatusBadge({ status }: { status: BrandStatus }) {
  const t = useTranslations("brands");
  const m = MAP[status];
  return <Badge tone={m.tone}>{t(m.key)}</Badge>;
}
