import type { Metadata } from "next";
import { getSeoEntry, getSiteSettings } from "@/lib/data";
import type { Locale } from "@/lib/locale";
import { pickText } from "@/lib/locale";

const baseUrl = () => process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function buildPageMetadata(opts: {
  locale: Locale;
  seoSection: string;
  path: string;
}): Promise<Metadata> {
  const [seo, fallbackSeo, site] = await Promise.all([
    getSeoEntry(opts.seoSection),
    getSeoEntry("default"),
    getSiteSettings(),
  ]);

  const title =
    pickText(opts.locale, seo?.titleEn, seo?.titleAr) ||
    pickText(opts.locale, fallbackSeo?.titleEn, fallbackSeo?.titleAr) ||
    pickText(opts.locale, site?.defaultMetaTitleEn, site?.defaultMetaTitleAr) ||
    "Oman Photo";
  const description =
    pickText(opts.locale, seo?.bodyEn, seo?.bodyAr) ||
    pickText(opts.locale, fallbackSeo?.bodyEn, fallbackSeo?.bodyAr) ||
    pickText(opts.locale, site?.defaultMetaDescriptionEn, site?.defaultMetaDescriptionAr) ||
    (opts.locale === "ar"
      ? "تصوير فاخر بروح تحريرية في مسقط. أبيض وأسود. بموعد مسبق."
      : "Editorial luxury photography and motion. Muscat. Black & white. By appointment.");

  const base = baseUrl().replace(/\/$/, "");
  const url = `${base}${opts.path}`;
  const rest = opts.path.replace(/^\/(en|ar)/, "");
  const enUrl = `${base}/en${rest}`;
  const arUrl = `${base}/ar${rest}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        en: enUrl,
        ar: arUrl,
      },
    },
    openGraph: {
      title,
      description,
      url,
      siteName: site?.brandName ?? "Oman Photo",
      type: "website",
      locale: opts.locale === "ar" ? "ar_OM" : "en_OM",
      alternateLocale: [opts.locale === "ar" ? "en_OM" : "ar_OM"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
