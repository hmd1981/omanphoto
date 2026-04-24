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
  const path = `/${locale}/book`;
  const title = locale === "ar" ? "الحجز — عمان فوتو" : "Book — Oman Photo";
  const description =
    locale === "ar"
      ? "احجز جلسة أو إنتاجاً مع عمان فوتو."
      : "Book a session or production with Oman Photo.";
  const base = baseUrl();
  return {
    title,
    description,
    alternates: {
      canonical: `${base}${path}`,
      languages: {
        en: `${base}/en/book`,
        ar: `${base}/ar/book`,
      },
    },
    openGraph: { title, description, url: `${base}${path}`, type: "website" },
  };
}

export default async function BookPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;

  return (
    <article className="editorial-section pb-28 pt-24 md:pb-36 md:pt-32">
      <header className="max-w-[44rem]">
        <p className="text-[10px] uppercase tracking-[0.42em] text-muted" data-route="book">
          book
        </p>
        <h1 className="font-display mt-8 text-[clamp(2.25rem,5vw,3.5rem)] font-medium leading-[1.08] tracking-[-0.03em] md:mt-10">
          {locale === "ar" ? "الحجز" : "Book"}
        </h1>
        <p className="editorial-prose mt-10 max-w-xl text-base font-light leading-relaxed text-ink-muted md:mt-12 md:text-lg">
          {locale === "ar"
            ? "أرسل الطلب عبر نموذج التواصل، أو راسلنا مباشرة."
            : "Send a request through the contact form, or reach us directly."}
        </p>
      </header>

      <div className="mt-16 flex flex-col gap-4 border-t border-line/50 pt-12 md:mt-20 md:pt-16">
        <Link
          href={localizedPath(locale, "/contact")}
          className="inline-flex min-h-[52px] max-w-md items-center justify-center bg-ink-bright px-8 py-4 text-center text-[11px] font-medium uppercase tracking-[0.26em] text-paper transition-opacity hover:opacity-90"
        >
          {locale === "ar" ? "انتقل إلى التواصل" : "Go to contact"}
        </Link>
        <p className="max-w-xl text-sm font-light text-ink-muted">
          {locale === "ar"
            ? "صفحة book مخصصة لتجميع روابط الحجز والمتابعة."
            : "This book page routes enquiries into the main contact flow."}
        </p>
      </div>
    </article>
  );
}
