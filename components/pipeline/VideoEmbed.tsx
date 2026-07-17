"use client";

import { useTranslations } from "next-intl";
import { Video } from "lucide-react";

function youtubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    let vid: string | null = null;
    if (u.hostname.includes("youtu.be")) {
      vid = u.pathname.slice(1);
    } else if (u.hostname.includes("youtube.com")) {
      vid = u.searchParams.get("v");
    }
    return vid ? `https://www.youtube.com/embed/${vid}` : null;
  } catch {
    return null;
  }
}

function vimeoEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("vimeo.com")) return null;
    const id = u.pathname.split("/").filter(Boolean).pop();
    return id ? `https://player.vimeo.com/video/${id}` : null;
  } catch {
    return null;
  }
}

function getEmbedUrl(url: string): string | null {
  return youtubeEmbedUrl(url) ?? vimeoEmbedUrl(url);
}

export function VideoEmbed({ videoUrl }: { videoUrl: string | null }) {
  const t = useTranslations("pipeline");

  if (!videoUrl) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-dashed border-line bg-canvas px-4 py-3 text-sm text-ink-muted">
        <Video className="size-4 shrink-0" />
        {t("videoUnavailable")}
      </div>
    );
  }

  const embedUrl = getEmbedUrl(videoUrl);

  if (!embedUrl) {
    // Unrecognised URL — render a plain link.
    return (
      <a
        href={videoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-sm text-brand-accent underline"
      >
        <Video className="size-4" />
        {t("videoTitle")}
      </a>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-black">
      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
        <iframe
          src={embedUrl}
          title={t("videoTitle")}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
          loading="lazy"
        />
      </div>
    </div>
  );
}
