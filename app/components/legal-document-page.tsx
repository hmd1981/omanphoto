import type { PageContent } from "@prisma/client";
import type { Locale } from "@/lib/locale";
import { pickPageContent } from "@/lib/locale";

type Props = {
  locale: Locale;
  sections: PageContent[];
  /** e.g. "Privacy" / "Terms" — shown when no page_kicker in CMS */
  fallbackKicker: string;
};

export function LegalDocumentPage({ locale, sections, fallbackKicker }: Props) {
  const byKey = Object.fromEntries(sections.map((s) => [s.sectionKey, s]));
  const kicker = pickPageContent(locale, byKey["page_kicker"]);
  const intro = pickPageContent(locale, byKey["intro"]);
  const updated = pickPageContent(locale, byKey["updated"]);

  const bodySections = sections
    .filter((s) => !["page_kicker", "intro", "updated"].includes(s.sectionKey))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <article className="editorial-section py-20 md:py-28 lg:py-32">
      <header className="max-w-3xl">
        <p className="text-[10px] uppercase tracking-[0.42em] text-muted">
          {kicker.title || fallbackKicker}
        </p>
        {intro.title ? (
          <h1 className="font-display mt-8 text-[clamp(2rem,4.5vw,3rem)] font-medium leading-[1.08] tracking-[-0.03em] md:mt-10">
            {intro.title}
          </h1>
        ) : null}
        {intro.body ? (
          <p className="editorial-prose mt-8 text-base font-light leading-relaxed text-ink-muted md:mt-10 md:text-lg">
            {intro.body}
          </p>
        ) : null}
        {updated.body ? (
          <p className="mt-6 text-xs font-light text-muted-soft">{updated.body}</p>
        ) : null}
      </header>

      <div className="mt-16 max-w-3xl space-y-14 border-t border-line/50 pt-16 md:mt-20 md:space-y-16 md:pt-20">
        {bodySections.map((row) => {
          const block = pickPageContent(locale, row);
          if (!block.title && !block.body) return null;
          return (
            <section key={row.sectionKey}>
              {block.title ? (
                <h2 className="font-display text-xl font-medium tracking-[-0.02em] text-ink-bright md:text-2xl">
                  {block.title}
                </h2>
              ) : null}
              {block.body ? (
                <div className="mt-5 whitespace-pre-line text-sm font-light leading-[1.9] text-ink-muted md:text-[0.9375rem]">
                  {block.body}
                </div>
              ) : null}
            </section>
          );
        })}
      </div>
    </article>
  );
}
