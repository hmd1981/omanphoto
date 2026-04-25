import Image from "next/image";
import type { PageHeroMedia, Media } from "@prisma/client";
import { resolvePageHeroVisual, isExternalUrl } from "@/lib/page-hero-visual";
import type { Locale } from "@/lib/locale";

type HeroRow = PageHeroMedia & { imageMedia: Media | null; videoMedia: Media | null };

type Props = {
  locale: Locale;
  hero: HeroRow | null;
  /** Intro text block (kicker, title, optional body) */
  children: React.ReactNode;
  /** Outer wrapper classes (e.g. editorial-section + vertical spacing) */
  className?: string;
};

/**
 * Top-of-page hero: editorial column + optional right-side media panel.
 * RTL: same DOM order [copy | media]; grid follows `dir` so copy sits on inline-start.
 */
export function PageHeroIntro({ locale, hero, children, className = "" }: Props) {
  const visual = hero ? resolvePageHeroVisual(hero) : null;

  if (!visual) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={className}>
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-14 lg:items-start">
        <div className="min-w-0 lg:col-span-5 xl:col-span-6">{children}</div>
        <div className="min-w-0 lg:col-span-7 xl:col-span-6">
          <PageHeroMediaPanel visual={visual} locale={locale} />
        </div>
      </div>
    </div>
  );
}

function PageHeroMediaPanel({
  visual,
  locale,
}: {
  visual: NonNullable<ReturnType<typeof resolvePageHeroVisual>>;
  locale: Locale;
}) {
  const label =
    locale === "ar"
      ? visual.mode === "video"
        ? "مقطع سينمائي للصفحة"
        : "صورة للصفحة"
      : visual.mode === "video"
        ? "Page video"
        : "Page image";

  return (
    <div className="overflow-hidden border border-line/45 bg-surface">
      <div className="relative aspect-[4/5] w-full sm:aspect-[5/6] md:aspect-[16/11] lg:aspect-[16/10]">
        {visual.mode === "video" ? (
          <video
            className="h-full w-full object-cover contrast-[1.02]"
            src={visual.src}
            autoPlay
            muted
            loop
            playsInline
            aria-label={label}
          />
        ) : isExternalUrl(visual.src) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={visual.src}
            alt=""
            className="h-full w-full object-cover contrast-[1.02]"
          />
        ) : (
          <Image
            src={visual.src}
            alt=""
            fill
            className="object-cover contrast-[1.02]"
            sizes="(min-width: 1024px) 42vw, 100vw"
            priority
            quality={88}
          />
        )}
      </div>
    </div>
  );
}
