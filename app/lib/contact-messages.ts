import { z } from "zod";
import type { Locale } from "./locale";

export type ContactFormCopy = ReturnType<typeof contactFormCopy>;

/** Page-level strings for contact (outside the form). */
export function contactPageChromeCopy(locale: Locale) {
  if (locale === "ar") {
    return {
      mapSection: "موقعنا",
      mapOpen: "عرض على خرائط جوجل",
      mapIframeTitle: "موقع الاستوديو على الخريطة",
      detailsLabel: "بريد وهاتف",
    };
  }
  return {
    mapSection: "Location",
    mapOpen: "Open in Google Maps",
    mapIframeTitle: "Studio location map",
    detailsLabel: "Email & phone",
  };
}

export function contactFormCopy(locale: Locale) {
  if (locale === "ar") {
    return {
      name: "الاسم",
      phone: "الجوال",
      email: "البريد",
      service: "الخدمة",
      date: "الموعد",
      message: "تفاصيل الطلب",
      namePlaceholder: "الاسم الكامل",
      phonePlaceholder: "+968 …",
      emailPlaceholder: "you@domain.com",
      messagePlaceholder: "نوع المناسبة، المدينة، التوقيت المناسب، وأي مرجع بصري يهمّكم.",
      selectService: "اختر الخدمة…",
      sending: "جاري الإرسال…",
      submit: "إرسال الطلب",
      successTitle: "تم استلام طلبك",
      successBody: "نتواصل معك خلال يومي عمل كحدّ أقصى.",
      errorGeneric: "تعذّر الإرسال. حاول مرة ثانية.",
      errorRateLimit: "محاولات كثيرة من نفس الجهاز. جرّب بعد قليل.",
      errors: {
        nameShort: "الاسم قصير",
        phoneInvalid: "رقم الجوال غير مكتمل",
        phoneChars: "استخدم الأرقام والرموز المعتادة فقط",
        emailInvalid: "صيغة البريد غير صحيحة",
        messageShort: "أضف تفاصيل أوضح (10 أحرف على الأقل)",
      },
    };
  }
  return {
    name: "Name",
    phone: "Phone",
    email: "Email",
    service: "Service",
    date: "Preferred date",
    message: "Message",
    namePlaceholder: "Full name",
    phonePlaceholder: "+968 …",
    emailPlaceholder: "you@domain.com",
    messagePlaceholder: "Occasion, location, timeline, and any visual references that matter.",
    selectService: "Select…",
    sending: "Sending…",
    submit: "Send enquiry",
    successTitle: "Message received",
    successBody: "We will reply within two business days.",
    errorGeneric: "Something went wrong. Please try again.",
    errorRateLimit: "Too many submissions from this address. Please try again later.",
    errors: {
      nameShort: "Name is too short",
      phoneInvalid: "Enter a valid phone number",
      phoneChars: "Use digits and phone symbols only",
      emailInvalid: "Enter a valid email",
      messageShort: "Please add a bit more detail (10+ characters)",
    },
  };
}

export function buildContactSchema(locale: Locale) {
  const c = contactFormCopy(locale);
  return z.object({
    name: z.string().trim().min(2, c.errors.nameShort).max(120),
    phone: z
      .string()
      .trim()
      .min(6, c.errors.phoneInvalid)
      .max(32)
      .regex(/^[\d\s+().-]+$/, c.errors.phoneChars),
    email: z.string().trim().email(c.errors.emailInvalid),
    service: z.string().optional(),
    date: z.string().optional(),
    message: z.string().trim().min(10, c.errors.messageShort).max(8000),
    locale: z.enum(["en", "ar"]).optional(),
    /** Honeypot — must be empty; hidden field in form. */
    _hp: z.preprocess((v) => (typeof v === "string" ? v : ""), z.string().max(0)),
  });
}
