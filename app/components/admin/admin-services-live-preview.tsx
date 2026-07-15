"use client";

import { MediaType } from "@/lib/generated/prisma/browser";
import type { PreviewViewport } from "@/components/admin/admin-preview-frame";
import { isExternalUrl, resolveMediaSrc } from "@/lib/media-url";

type ServiceMediaLite = {
  id: string;
  sortOrder: number;
  media: { id: string; type: MediaType; url: string | null; filePath: string | null };
};

type Service = {
  id: string;
  slug: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  sortOrder: number;
  published: boolean;
  serviceMedia?: ServiceMediaLite[];
};

type Props = {
  viewport: PreviewViewport;
  services: Service[];
  locale: "en" | "ar";
};

function coverSrc(s: Service): string | null {
  const rows = [...(s.serviceMedia ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
  for (const r of rows) {
    if (r.media.type !== MediaType.IMAGE) continue;
    const src = resolveMediaSrc(r.media).trim();
    if (src) return src;
  }
  return null;
}

export function AdminServicesLivePreview({ viewport, services, locale }: Props) {
  const ordered = [...services].sort((a, b) => a.sortOrder - b.sortOrder || a.titleEn.localeCompare(b.titleEn));

  return (
    <div className="bg-paper px-2 py-4 text-start md:px-6 md:py-8" dir={locale === "ar" ? "rtl" : "ltr"}>
      <p className="text-[10px] uppercase tracking-[0.35em] text-muted">Services page body (intro block is edited under Page text)</p>
      <p className="mt-2 text-xs text-muted">
        {locale === "en" ? "English" : "Arabic"} preview — first assigned image is the listing cover.
      </p>
      <div className={`mt-10 space-y-16 ${viewport === "mobile" ? "" : "md:space-y-24"}`}>
        {ordered.map((s, i) => {
          const title = locale === "ar" ? s.titleAr || s.titleEn : s.titleEn;
          const body = locale === "ar" ? s.descriptionAr || s.descriptionEn : s.descriptionEn;
          const src = coverSrc(s);
          return (
            <section
              key={s.id}
              className={`grid gap-8 border-t border-line/80 pt-12 ${
                viewport === "mobile" ? "" : "md:grid-cols-12 md:gap-12 md:pt-16"
              }`}
            >
              <div className={viewport === "mobile" ? "" : "md:col-span-5"}>
                <div className="relative aspect-[4/5] w-full overflow-hidden border border-line/50 bg-surface sm:aspect-[5/6] md:aspect-[4/3] lg:aspect-[4/5]">
                  {src ? (
                    isExternalUrl(src) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={src} alt="" className="h-full w-full object-cover" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={src} alt="" className="h-full w-full object-cover" />
                    )
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-b from-surface to-paper px-4 text-center">
                      <span className="font-display text-xl text-muted/35">○</span>
                      <span className="text-[9px] uppercase tracking-[0.3em] text-muted">No cover</span>
                    </div>
                  )}
                </div>
              </div>
              <div className={`flex flex-col justify-center ${viewport === "mobile" ? "" : "md:col-span-7"}`}>
                <p className="font-display text-xl text-muted-soft">{String(i + 1).padStart(2, "0")}</p>
                <h2
                  className={`font-display mt-5 font-medium tracking-[-0.02em] text-ink-bright md:mt-8 ${
                    viewport === "mobile" ? "text-2xl" : "text-3xl md:text-4xl"
                  }`}
                >
                  {title}
                </h2>
                {!s.published ? (
                  <span className="mt-2 inline-block border border-amber-700/80 px-2 py-0.5 text-[9px] uppercase tracking-[0.2em] text-amber-200">
                    Unpublished
                  </span>
                ) : null}
                <p className={`mt-6 font-light leading-[1.85] text-ink-muted md:mt-8 ${viewport === "mobile" ? "text-sm" : "text-base md:text-lg"}`}>
                  {body}
                </p>
              </div>
            </section>
          );
        })}
      </div>
      {ordered.length === 0 ? <p className="mt-12 text-sm text-muted">No services yet.</p> : null}
    </div>
  );
}
