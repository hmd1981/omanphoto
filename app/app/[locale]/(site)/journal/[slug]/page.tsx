import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedJournalPostBySlug } from "@/lib/data";
import { journalBody, journalExcerpt, journalTitle } from "@/lib/journal";
import { localizedPath } from "@/lib/locale";
import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";
import { isExternalUrl, resolveMediaSrc } from "@/lib/media-url";
import { ui } from "@/lib/ui-strings";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) return {};
  const locale = raw as Locale;
  const post = await getPublishedJournalPostBySlug(slug);
  if (!post) return {};
  const title = `${journalTitle(locale, post)} — Oman Photo`;
  const description = journalExcerpt(locale, post).slice(0, 220) || journalBody(locale, post).slice(0, 220);
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const path = `/${locale}/journal/${slug}`;
  const url = `${base}${path}`;
  const rest = path.replace(/^\/(en|ar)/, "");
  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: { en: `${base}/en${rest}`, ar: `${base}/ar${rest}` },
    },
    openGraph: { title, description, url, type: "article" },
  };
}

export default async function JournalArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const post = await getPublishedJournalPostBySlug(slug);
  if (!post) notFound();

  const u = ui(locale);
  const title = journalTitle(locale, post);
  const body = journalBody(locale, post);
  const coverSrc = post.coverMedia ? resolveMediaSrc(post.coverMedia).trim() : "";
  const date = post.publishedAt.toLocaleDateString(locale === "ar" ? "ar-OM" : "en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const paragraphs = body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  return (
    <article className="editorial-section py-20 md:py-28 lg:py-32">
      <nav className="text-[10px] uppercase tracking-[0.32em] text-muted">
        <Link href={localizedPath(locale, "/journal")} className="hover:text-ink-bright hover:underline underline-offset-4">
          {u.journalBreadcrumb}
        </Link>
      </nav>

      <header className="mt-10 max-w-3xl md:mt-12">
        <p className="text-[10px] uppercase tracking-[0.32em] text-muted">{date}</p>
        <h1 className="font-display mt-6 text-[clamp(2rem,4.5vw,3.25rem)] font-medium leading-[1.1] tracking-[-0.03em]">
          {title}
        </h1>
      </header>

      {coverSrc ? (
        <div className="relative mt-12 aspect-[21/11] w-full max-w-5xl overflow-hidden border border-line/50 bg-surface md:mt-16 md:aspect-[21/9]">
          {isExternalUrl(coverSrc) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverSrc} alt="" className="h-full w-full object-cover" />
          ) : (
            <Image src={coverSrc} alt="" fill className="object-cover" sizes="100vw" priority quality={90} />
          )}
        </div>
      ) : null}

      <div className="prose-spacing mt-12 max-w-3xl space-y-6 md:mt-16">
        {paragraphs.map((para, i) => (
          <p key={i} className="text-[0.9375rem] font-light leading-[1.92] text-ink-muted md:text-lg md:leading-[1.9]">
            {para}
          </p>
        ))}
      </div>

      <p className="mt-16 border-t border-line/50 pt-12 text-sm font-light text-ink-muted">
        <Link
          href={localizedPath(locale, "/journal")}
          className="text-[10px] uppercase tracking-[0.34em] text-ink-bright underline-offset-4 hover:underline"
        >
          {u.journalBackToIndex}
        </Link>
      </p>
    </article>
  );
}
