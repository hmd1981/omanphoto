import type { Locale } from "@/lib/locale";

/**
 * Sets <html lang=…> and <html dir=…> for proper RTL, SEO, and screen readers.
 * Inline script runs before paint so crawlers and first-render get the correct attributes.
 */
export function DocumentLocale({ locale }: { locale: Locale }) {
  const lang = locale === "ar" ? "ar" : "en";
  const dir = locale === "ar" ? "rtl" : "ltr";
  return (
    <script
      suppressHydrationWarning
      dangerouslySetInnerHTML={{
        __html: `document.documentElement.lang="${lang}";document.documentElement.dir="${dir}";`,
      }}
    />
  );
}
