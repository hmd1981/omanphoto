"use client";

import { useEffect } from "react";
import type { Locale } from "@/lib/locale";

/** Sets documentElement lang + dir for proper RTL and typography (App Router has a single root <html>). */
export function DocumentLocale({ locale }: { locale: Locale }) {
  useEffect(() => {
    const html = document.documentElement;
    html.lang = locale === "ar" ? "ar" : "en";
    html.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale]);
  return null;
}
