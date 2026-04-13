import { notFound } from "next/navigation";
import { DocumentLocale } from "@/components/document-locale";
import { isLocale, locales, type Locale } from "@/lib/locale";

/** CMS-backed pages must not serve stale RSC/HTML from the full route cache. */
export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleRootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  return (
    <>
      <DocumentLocale locale={locale} />
      {children}
    </>
  );
}
