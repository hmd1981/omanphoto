"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/locale";
import { ui } from "@/lib/ui-strings";

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname() || "/";
  const rest = pathname.replace(/^\/(en|ar)/, "") || "/";
  const enHref = `/en${rest === "/" ? "" : rest}`;
  const arHref = `/ar${rest === "/" ? "" : rest}`;
  const labels = ui(locale);

  return (
    <div
      className="flex items-center gap-3 text-[10px] uppercase tracking-[0.32em] text-muted"
      lang="en"
      dir="ltr"
    >
      <Link
        href={enHref}
        className={`transition-colors duration-300 ${locale === "en" ? "text-ink-bright" : "hover:text-ink-bright/90"}`}
        hrefLang="en"
      >
        {labels.languageEn}
      </Link>
      <span className="text-muted-soft" aria-hidden>
        /
      </span>
      <Link
        href={arHref}
        className={`transition-colors duration-300 ${locale === "ar" ? "text-ink-bright" : "hover:text-ink-bright/90"}`}
        hrefLang="ar"
      >
        {labels.languageAr}
      </Link>
    </div>
  );
}
