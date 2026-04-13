import type { Category, HeroSettings, Media, PageContent, Service, SiteSettings } from "@prisma/client";

export type Locale = "en" | "ar";

export const locales: Locale[] = ["en", "ar"];

export const defaultLocale: Locale = "en";

export function isLocale(value: string): value is Locale {
  return value === "en" || value === "ar";
}

/**
 * Monolingual pick: English route uses only `en`, Arabic route uses only `ar`.
 * No automatic cross-language fallback — editors fill each locale in the admin, or content stays empty.
 */
export function pickText(
  locale: Locale,
  en: string | null | undefined,
  ar: string | null | undefined,
): string {
  const e = (en ?? "").trim();
  const a = (ar ?? "").trim();
  if (locale === "ar") return a;
  return e;
}

/**
 * Optional fallback to the other locale — use only where you explicitly want a visible string
 * when one language is missing (e.g. “Copy from English” was not used). Not used for long editorial body copy.
 */
export function pickTextWithOptionalFallback(
  locale: Locale,
  en: string | null | undefined,
  ar: string | null | undefined,
): string {
  const primary = pickText(locale, en, ar);
  if (primary) return primary;
  const e = (en ?? "").trim();
  const a = (ar ?? "").trim();
  return locale === "ar" ? e : a;
}

export function pickPageContent(locale: Locale, row: PageContent | null | undefined): { title: string; body: string } {
  if (!row) return { title: "", body: "" };
  return {
    title: pickText(locale, row.titleEn, row.titleAr),
    body: pickText(locale, row.bodyEn, row.bodyAr),
  };
}

export function categoryLabel(locale: Locale, c: Category): string {
  return pickText(locale, c.nameEn, c.nameAr);
}

export function categoryDescription(locale: Locale, c: Category): string {
  return pickText(locale, c.descriptionEn, c.descriptionAr);
}

export function mediaTitle(locale: Locale, m: Media): string {
  return pickText(locale, m.titleEn, m.titleAr);
}

export function serviceTitle(locale: Locale, s: Service): string {
  return pickText(locale, s.titleEn, s.titleAr);
}

export function serviceDescription(locale: Locale, s: Service): string {
  return pickText(locale, s.descriptionEn, s.descriptionAr);
}

export function siteBrand(settings: SiteSettings | null): string {
  return settings?.brandName?.trim() || "Oman Photo";
}

export function localizedPath(locale: Locale, path: string): string {
  if (!path.startsWith("/")) return path;
  if (path.startsWith("/en") || path.startsWith("/ar")) return path;
  const p = path === "/" ? "" : path;
  return `/${locale}${p}`;
}

export function heroCopy(
  locale: Locale,
  hero: (HeroSettings & { imageMedia: Media | null; videoMedia?: Media | null }) | null,
  site: SiteSettings | null,
): {
  eyebrow: string;
  overlayTitle: string;
  overlaySubtitle: string;
  ctaLabel: string;
  ctaHref: string;
} {
  const overlayTitle =
    pickText(locale, hero?.overlayTitleEn, hero?.overlayTitleAr) || siteBrand(site);
  const overlaySubtitle = pickText(locale, hero?.overlaySubtitleEn, hero?.overlaySubtitleAr);
  const ctaLabel = pickText(locale, hero?.ctaLabelEn, hero?.ctaLabelAr);
  const rawHref = hero?.ctaHref?.trim() || "/portfolio";
  const ctaHref = localizedPath(locale, rawHref);
  const eyebrowFromHero = pickText(locale, hero?.eyebrowEn, hero?.eyebrowAr);
  const eyebrowFromSite = pickText(locale, site?.heroEyebrowEn, site?.heroEyebrowAr);
  const eyebrow = eyebrowFromHero || eyebrowFromSite;
  return { eyebrow, overlayTitle, overlaySubtitle, ctaLabel, ctaHref };
}
