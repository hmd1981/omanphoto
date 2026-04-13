import type { Locale } from "./locale";

/** Non-CMS UI bits (filters, empty states, aria). */
export function ui(locale: Locale) {
  if (locale === "ar") {
    return {
      portfolioFilterAll: "الكل",
      portfolioEmpty: "لا توجد عناصر منشورة في هذا الاختيار من المعارض.",
      video: "فيديو",
      languageEn: "English",
      languageAr: "العربية",
    };
  }
  return {
    portfolioFilterAll: "All",
    portfolioEmpty: "No published items in this gallery selection.",
    video: "Video",
    languageEn: "English",
    languageAr: "Arabic",
  };
}
