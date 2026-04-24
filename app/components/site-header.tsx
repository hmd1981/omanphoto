import Link from "next/link";
import type { SiteSettings } from "@prisma/client";
import { LanguageSwitcher } from "@/components/language-switcher";
import type { Locale } from "@/lib/locale";
import { localizedPath, pickTextWithOptionalFallback } from "@/lib/locale";
import { ui } from "@/lib/ui-strings";

type Props = {
  settings: SiteSettings | null;
  locale: Locale;
};

export function SiteHeader({ settings, locale }: Props) {
  const s = settings;
  const u = ui(locale);
  const links = [
    { href: localizedPath(locale, "/"), label: pickTextWithOptionalFallback(locale, s?.navHomeEn, s?.navHomeAr) },
    { href: localizedPath(locale, "/portfolio"), label: pickTextWithOptionalFallback(locale, s?.navPortfolioEn, s?.navPortfolioAr) },
    { href: localizedPath(locale, "/services"), label: pickTextWithOptionalFallback(locale, s?.navServicesEn, s?.navServicesAr) },
    { href: localizedPath(locale, "/about"), label: pickTextWithOptionalFallback(locale, s?.navAboutEn, s?.navAboutAr) },
    { href: localizedPath(locale, "/ai-studio"), label: u.navAiStudio },
    { href: localizedPath(locale, "/book"), label: u.navBook },
    { href: localizedPath(locale, "/contact"), label: pickTextWithOptionalFallback(locale, s?.navContactEn, s?.navContactAr) },
  ];
  const brand = s?.brandName ?? "Oman Photo";
  const menu = pickTextWithOptionalFallback(locale, s?.navMenuLabelEn, s?.navMenuLabelAr);

  return (
    <header className="border-b border-line/60">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-7 md:gap-10 md:px-10 md:py-9">
        <Link
          href={localizedPath(locale, "/")}
          className="font-display text-[1.35rem] tracking-[0.2em] text-ink-bright transition-opacity duration-300 hover:opacity-85 md:text-[1.65rem] md:tracking-[0.22em]"
        >
          {brand}
        </Link>
        <div className="flex items-center gap-6 md:gap-10">
          <nav className="hidden items-center gap-9 text-[11px] uppercase tracking-[0.3em] text-muted md:flex lg:gap-11">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="relative text-ink-bright/90 transition-colors duration-300 after:absolute after:-bottom-1 after:start-0 after:h-px after:w-0 after:bg-ink-bright after:transition-[width] duration-300 after:content-[''] hover:text-ink-bright hover:after:w-full focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-ink-bright/50"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <LanguageSwitcher locale={locale} />
          <MobileNav links={links} menuLabel={menu} className="md:hidden" />
        </div>
      </div>
    </header>
  );
}

function MobileNav({
  links,
  menuLabel,
  className,
}: {
  links: { href: string; label: string }[];
  menuLabel: string;
  className?: string;
}) {
  return (
    <details className={`relative ${className ?? ""}`}>
      <summary className="cursor-pointer list-none text-[11px] uppercase tracking-[0.3em] text-muted transition-colors hover:text-ink-bright">
        {menuLabel}
      </summary>
      <div className="absolute end-0 z-50 mt-4 min-w-[13rem] border border-line/80 bg-paper/95 px-5 py-5 backdrop-blur-md">
        <ul className="flex flex-col gap-4 text-[11px] uppercase tracking-[0.24em]">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="text-ink-muted transition-colors hover:text-ink-bright">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}
