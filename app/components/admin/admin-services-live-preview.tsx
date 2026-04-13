"use client";

import type { PreviewViewport } from "@/components/admin/admin-preview-frame";

type Service = {
  id: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  sortOrder: number;
  published: boolean;
};

type Props = {
  viewport: PreviewViewport;
  services: Service[];
  locale: "en" | "ar";
};

export function AdminServicesLivePreview({ viewport, services, locale }: Props) {
  const ordered = [...services].sort((a, b) => a.sortOrder - b.sortOrder || a.titleEn.localeCompare(b.titleEn));

  return (
    <div className="bg-paper px-2 py-4 text-start md:px-6 md:py-8" dir={locale === "ar" ? "rtl" : "ltr"}>
      <p className="text-[10px] uppercase tracking-[0.35em] text-muted">Services page body (intro block is edited under Page text)</p>
      <p className="mt-2 text-xs text-muted">
        Preview language: {locale === "en" ? "English" : "Arabic"} — matches public /{locale}/services layout.
      </p>
      <div className={`mt-10 space-y-16 ${viewport === "mobile" ? "" : "md:space-y-24"}`}>
        {ordered.map((s, i) => {
          const title = locale === "ar" ? s.titleAr || s.titleEn : s.titleEn;
          const body = locale === "ar" ? s.descriptionAr || s.descriptionEn : s.descriptionEn;
          return (
            <section
              key={s.id}
              className={`grid gap-8 border-t border-line/80 pt-12 ${
                viewport === "mobile" ? "" : "md:grid-cols-12 md:gap-16 md:pt-16"
              }`}
            >
              <div className={viewport === "mobile" ? "" : "md:col-span-4"}>
                <p className="font-display text-xl text-muted-soft">{String(i + 1).padStart(2, "0")}</p>
                <h2
                  className={`font-display mt-6 font-medium tracking-[-0.02em] text-ink-bright ${
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
              </div>
              <div className={viewport === "mobile" ? "" : "md:col-span-8"}>
                <p className={`font-light leading-[1.85] text-ink-muted ${viewport === "mobile" ? "text-sm" : "text-base md:text-lg"}`}>
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
