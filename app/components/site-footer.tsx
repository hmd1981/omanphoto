import Link from "next/link";
import type { SiteSettings } from "@prisma/client";
import type { Locale } from "@/lib/locale";
import { resolveContactLinks } from "@/lib/contact-links";
import { localizedPath, pickText, pickTextWithOptionalFallback } from "@/lib/locale";

type Props = {
  settings: SiteSettings | null;
  locale: Locale;
};

export function SiteFooter({ settings, locale }: Props) {
  const s = settings;
  const links = resolveContactLinks(s);
  const brand = s?.brandName ?? "Oman Photo";
  const tagline = pickText(locale, s?.footerTaglineEn, s?.footerTaglineAr);
  const email = links.email;
  const location = s?.footerLocationLine ?? "";
  const book = pickTextWithOptionalFallback(locale, s?.footerBookLabelEn, s?.footerBookLabelAr);
  const copy = s?.copyrightName ?? "Oman Photo";
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line/60">
      <div className="mx-auto flex max-w-7xl flex-col gap-14 px-6 py-16 md:flex-row md:items-end md:justify-between md:gap-12 md:px-10 md:py-24">
        <div className="max-w-md">
          <p className="font-display text-[1.5rem] tracking-[0.2em] md:text-[1.75rem]">{brand}</p>
          {tagline ? <p className="mt-6 text-sm leading-[1.8] text-muted">{tagline}</p> : null}
        </div>
        <div className="flex flex-col gap-6 text-[11px] uppercase tracking-[0.3em] text-muted md:items-end">
          <Link
            href={localizedPath(locale, "/contact")}
            className="text-ink-bright/90 transition-colors duration-300 hover:text-ink-bright"
          >
            {book}
          </Link>
          {email ? (
            <a href={`mailto:${email}`} className="text-ink-muted transition-colors duration-300 hover:text-ink-bright">
              {email}
            </a>
          ) : null}
          {links.phone ? (
            <a
              href={links.telHref}
              className="text-ink-muted transition-colors duration-300 hover:text-ink-bright"
            >
              {links.phone}
            </a>
          ) : null}
          {links.instagramUrl || links.whatsappUrl ? (
            <p className="flex flex-wrap gap-x-4 gap-y-2 text-[10px] uppercase tracking-[0.28em]">
              {links.instagramUrl ? (
                <a
                  href={links.instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted transition-colors duration-300 hover:text-ink-bright"
                >
                  Instagram
                </a>
              ) : null}
              {links.instagramUrl && links.whatsappUrl ? (
                <span className="text-muted-soft" aria-hidden>
                  ·
                </span>
              ) : null}
              {links.whatsappUrl ? (
                <a
                  href={links.whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted transition-colors duration-300 hover:text-ink-bright"
                >
                  WhatsApp
                </a>
              ) : null}
            </p>
          ) : null}
          {location ? <p className="text-xs normal-case tracking-normal text-muted-soft">{location}</p> : null}
          <p className="text-xs normal-case tracking-normal text-muted-soft">
            © {year} {copy}
          </p>
        </div>
      </div>
    </footer>
  );
}
