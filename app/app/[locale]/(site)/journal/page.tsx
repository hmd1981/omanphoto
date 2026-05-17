import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JournalPostCard } from "@/components/journal-post-card";
import { getPageSectionMap, getPublishedJournalPosts } from "@/lib/data";
import { buildPageMetadata } from "@/lib/seo";
import { localizedPath, pickPageContent } from "@/lib/locale";
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
  return buildPageMetadata({ locale, seoSection: "journal", path: `/${locale}/journal` });
}

export default async function JournalIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const u = ui(locale);

  const [sections, posts] = await Promise.all([
    getPageSectionMap("journal"),
    getPublishedJournalPosts(),
  ]);
  const kicker = pickPageContent(locale, sections["page_kicker"]);
  const intro = pickPageContent(locale, sections["intro"]);

  return (
    <div className="editorial-section py-20 md:py-28 lg:py-32">
      <header className="max-w-3xl">
        {kicker.title ? (
          <p className="text-[10px] uppercase tracking-[0.42em] text-muted">{kicker.title}</p>
        ) : null}
        <h1 className="font-display mt-8 text-[clamp(2.25rem,5vw,3.5rem)] font-medium leading-[1.08] tracking-[-0.03em] md:mt-10">
          {intro.title || u.journalTitle}
        </h1>
        {intro.body ? (
          <p className="editorial-prose mt-8 text-base font-light leading-relaxed text-ink-muted md:mt-10 md:text-lg">
            {intro.body}
          </p>
        ) : null}
      </header>

      {posts.length === 0 ? (
        <p className="mt-16 text-sm font-light text-muted">{u.journalEmpty}</p>
      ) : (
        <div className="mt-16 md:mt-20">
          {posts.map((post) => (
            <JournalPostCard key={post.id} locale={locale} post={post} readLabel={u.journalReadMore} />
          ))}
        </div>
      )}

      <p className="mt-16 border-t border-line/50 pt-12 text-sm font-light text-ink-muted">
        {u.journalCtaNote}{" "}
        <Link
          href={localizedPath(locale, "/contact")}
          className="text-ink-bright underline-offset-4 hover:underline"
        >
          {u.journalCtaLink}
        </Link>
      </p>
    </div>
  );
}
