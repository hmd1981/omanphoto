import { notFound } from "next/navigation";
import { AssistantWidget } from "@/components/assistant-widget";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { StructuredData } from "@/components/structured-data";
import { getSiteSettings } from "@/lib/data";
import { isLocale, type Locale } from "@/lib/locale";

export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const settings = await getSiteSettings();
  const assistantEnabled = process.env.NEXT_PUBLIC_ASSISTANT_ENABLED === "1";

  return (
    <div className="flex min-h-screen flex-col">
      <StructuredData settings={settings} />
      <SiteHeader settings={settings} locale={locale} />
      <main className="min-h-[50vh]">{children}</main>
      <SiteFooter settings={settings} locale={locale} />
      {assistantEnabled ? <AssistantWidget locale={locale} /> : null}
    </div>
  );
}
