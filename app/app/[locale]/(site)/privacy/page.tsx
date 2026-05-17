import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalDocumentPage } from "@/components/legal-document-page";
import { getPageSections } from "@/lib/data";
import { buildPageMetadata } from "@/lib/seo";
import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";
import { ui } from "@/lib/ui-strings";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  if (!isLocale(raw)) return {};
  const locale = raw as Locale;
  return buildPageMetadata({ locale, seoSection: "privacy", path: `/${locale}/privacy` });
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const sections = await getPageSections("privacy");
  const u = ui(locale);

  return <LegalDocumentPage locale={locale} sections={sections} fallbackKicker={u.legalPrivacyKicker} />;
}
