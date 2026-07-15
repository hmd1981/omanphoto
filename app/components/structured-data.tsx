import type { SiteSettings } from "@/lib/generated/prisma/browser";
import { resolveContactLinks } from "@/lib/contact-links";

type Props = {
  settings: SiteSettings | null;
};

/** LocalBusiness JSON-LD for AdSense / search trust signals. */
export function StructuredData({ settings }: Props) {
  const links = resolveContactLinks(settings);
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://omanphoto.com").replace(/\/$/, "");
  const brand = settings?.brandName ?? "Oman Photo";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: brand,
    url: base,
    description:
      settings?.defaultMetaDescriptionEn ??
      "Editorial photography and cinematic production in Muscat, Sultanate of Oman.",
    email: links.email || undefined,
    telephone: links.phone || undefined,
    address: settings?.footerLocationLine
      ? {
          "@type": "PostalAddress",
          addressLocality: "Muscat",
          addressCountry: "OM",
          streetAddress: settings.footerLocationLine,
        }
      : undefined,
    areaServed: { "@type": "Country", name: "Oman" },
    sameAs: [links.instagramUrl, links.whatsappUrl].filter(Boolean),
    image: `${base}/favicon.ico`,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
