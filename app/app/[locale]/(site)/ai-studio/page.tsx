import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { localizedPath } from "@/lib/locale";
import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";

const baseUrl = () => (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  if (!isLocale(raw)) return {};
  const locale = raw as Locale;
  const path = `/${locale}/ai-studio`;
  const title = locale === "ar" ? "استوديو الذكاء الاصطناعي — عمان فوتو" : "AI Studio — Oman Photo";
  const description =
    locale === "ar"
      ? "أدوات وخدمات الذكاء الاصطناعي لسير عمل التصوير والإنتاج."
      : "AI-assisted workflows for photography and production at Oman Photo.";
  const base = baseUrl();
  return {
    title,
    description,
    alternates: {
      canonical: `${base}${path}`,
      languages: {
        en: `${base}/en/ai-studio`,
        ar: `${base}/ar/ai-studio`,
      },
    },
    openGraph: { title, description, url: `${base}${path}`, type: "website" },
  };
}

export default async function AiStudioPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;

  return (
    <article className="editorial-section pb-28 pt-24 md:pb-36 md:pt-32">
      <header className="max-w-[44rem]">
        <p className="text-[10px] uppercase tracking-[0.42em] text-muted" data-route="ai-studio">
          ai-studio
        </p>
        <h1 className="font-display mt-8 text-[clamp(2.25rem,5vw,3.5rem)] font-medium leading-[1.08] tracking-[-0.03em] md:mt-10">
          {locale === "ar" ? "استوديو الذكاء الاصطناعي" : "AI Studio"}
        </h1>
        <p className="editorial-prose mt-10 max-w-xl text-base font-light leading-relaxed text-ink-muted md:mt-12 md:text-lg">
          {locale === "ar"
            ? "صفحة مخصصة لدمج أدوات الذكاء الاصطناعي في مسار العمل التحريري لدى عمان فوتو."
            : "A dedicated space for AI-assisted tooling inside Oman Photo’s editorial workflow."}
        </p>
      </header>

      <div className="mt-16 max-w-xl border-t border-line/50 pt-12 text-sm font-light leading-relaxed text-ink-muted md:mt-20 md:pt-16">
        <p>
          {locale === "ar"
            ? "للاستفسارات والمواعيد، انتقل إلى صفحة التواصل."
            : "For appointments and briefs, continue to Contact."}
        </p>
        <Link
          href={localizedPath(locale, "/contact")}
          className="mt-6 inline-flex min-h-[44px] items-center text-[11px] uppercase tracking-[0.28em] text-ink-bright underline-offset-4 transition-colors hover:underline"
        >
          {locale === "ar" ? "التواصل" : "Contact"}
        </Link>
      </div>
    </article>
  );
}
