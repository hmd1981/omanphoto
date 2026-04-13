"use client";

import { MediaType } from "@prisma/client";
import type { PreviewViewport } from "@/components/admin/admin-preview-frame";

type Props = {
  viewport: PreviewViewport;
  mediaType: MediaType;
  imageSrc: string | null;
  videoSrc: string | null;
  eyebrow: string;
  overlayTitle: string;
  overlaySubtitle: string;
  ctaLabel: string;
  ctaHref: string;
  rtl?: boolean;
};

export function AdminHeroLivePreview({
  viewport,
  mediaType,
  imageSrc,
  videoSrc,
  eyebrow,
  overlayTitle,
  overlaySubtitle,
  ctaLabel,
  ctaHref,
  rtl,
}: Props) {
  const videoMode = mediaType === MediaType.VIDEO;
  const minH = viewport === "mobile" ? "min-h-[380px]" : "min-h-[480px]";

  return (
    <section className={`relative w-full overflow-hidden ${minH}`} dir={rtl ? "rtl" : "ltr"}>
      <div className="absolute inset-0 bg-paper">
        {videoMode && videoSrc ? (
          <video key={videoSrc} className="h-full w-full scale-[1.01] object-cover" src={videoSrc} autoPlay muted loop playsInline />
        ) : !videoMode && imageSrc ? (
          <div className={`relative h-full w-full ${minH}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageSrc} alt="" className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="flex h-full min-h-[200px] w-full items-center justify-center bg-surface px-4 text-center text-xs text-muted">
            {videoMode ? "Add a gallery video or external URL" : "Choose an image from the gallery"}
          </div>
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-paper via-paper/55 to-paper/20" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(5,5,5,0.55)_100%)]" />

      <div
        className={`relative z-10 mx-auto flex max-w-7xl flex-col justify-end text-start ${
          viewport === "mobile" ? "min-h-[380px] px-4 pb-16 pt-24" : "min-h-[480px] px-6 pb-24 pt-28 md:px-10 md:pb-28"
        }`}
      >
        {eyebrow ? (
          <p className="text-[10px] uppercase tracking-[0.45em] text-muted">{eyebrow}</p>
        ) : null}
        <h1
          className={`font-display mt-6 max-w-[18ch] font-medium leading-[1.02] tracking-[-0.02em] text-ink-bright ${
            viewport === "mobile" ? "text-[clamp(2rem,8vw,3rem)]" : "text-[clamp(2.5rem,5vw,4rem)]"
          }`}
        >
          {overlayTitle || "Title"}
        </h1>
        {overlaySubtitle ? (
          <p
            className={`mt-6 max-w-xl font-light leading-relaxed text-ink-muted ${
              viewport === "mobile" ? "text-sm" : "text-base md:text-lg"
            }`}
          >
            {overlaySubtitle}
          </p>
        ) : null}
        {ctaLabel ? (
          <div className="mt-10">
            <span className="inline-block border border-ink-bright/50 bg-transparent px-8 py-3 text-[10px] uppercase tracking-[0.38em] text-ink-bright">
              {ctaLabel}
            </span>
            {ctaHref ? (
              <span className="ms-3 text-[10px] text-muted">
                → <span className="text-ink-muted">{ctaHref}</span>
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
