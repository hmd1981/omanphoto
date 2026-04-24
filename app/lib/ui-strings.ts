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
      navAiStudio: "استوديو AI",
      navBook: "الحجز",
      homeCtaAiStudio: "استكشف استوديو AI",
      homeCtaBook: "احجز جلسة",
      footerAiStudio: "استوديو AI",
      footerBooking: "الحجز",
      serviceBookThis: "احجز هذه الخدمة",
      bookSelectedService: "الخدمة المختارة",
    };
  }
  return {
    portfolioFilterAll: "All",
    portfolioEmpty: "No published items in this gallery selection.",
    video: "Video",
    languageEn: "English",
    languageAr: "Arabic",
    navAiStudio: "AI Studio",
    navBook: "Book",
    homeCtaAiStudio: "Explore AI Studio",
    homeCtaBook: "Book a session",
    footerAiStudio: "AI Studio",
    footerBooking: "Booking",
    serviceBookThis: "Book this service",
    bookSelectedService: "Selected service",
  };
}
