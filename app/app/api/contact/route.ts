import { NextResponse } from "next/server";
import { buildContactSchema } from "@/lib/contact-messages";
import type { Locale } from "@/lib/locale";
import { prisma } from "@/lib/prisma";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

const CONTACT_WINDOW_MS = 60 * 60 * 1000;
const CONTACT_MAX = 12;

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limited = rateLimit(`contact:${ip}`, CONTACT_MAX, CONTACT_WINDOW_MS);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many submissions. Please try again later.", code: "RATE_LIMIT" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
    );
  }

  const json = await request.json().catch(() => null);
  const loc: Locale = json?.locale === "ar" ? "ar" : "en";
  const schema = buildContactSchema(loc);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return NextResponse.json(
      { error: "Validation failed", fieldErrors: flat.fieldErrors },
      { status: 400 },
    );
  }
  const { name, phone, email, service, date, message, locale: localeField } = parsed.data;
  let eventDate: Date | null = null;
  if (date) {
    const d = new Date(date);
    if (!Number.isNaN(d.getTime())) eventDate = d;
  }
  await prisma.contactInquiry.create({
    data: {
      name,
      phone,
      email,
      service: service ?? null,
      eventDate,
      message,
      locale: localeField ?? loc,
    },
  });
  return NextResponse.json({ ok: true });
}
