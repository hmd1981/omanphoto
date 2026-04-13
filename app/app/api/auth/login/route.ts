import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSessionToken, setSessionCookie, verifyPassword } from "@/lib/auth";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(512),
});

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

async function constantTimeDelay() {
  await new Promise((r) => setTimeout(r, 250));
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limited = rateLimit(`login:${ip}`, MAX_ATTEMPTS, WINDOW_MS);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later.", code: "RATE_LIMIT", retryAfterSec: limited.retryAfterSec },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    await constantTimeDelay();
    return NextResponse.json({ error: "Invalid request", code: "BAD_JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    await constantTimeDelay();
    return NextResponse.json({ error: "Invalid request", code: "VALIDATION" }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const normalized = email.trim().toLowerCase();

  /** Valid bcrypt hash so compare() always runs the same code path when email is unknown. */
  const dummyHash = "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";
  const user = await prisma.user.findUnique({ where: { email: normalized } });
  const ok = await verifyPassword(password, user?.passwordHash ?? dummyHash);

  await constantTimeDelay();

  if (!user || !ok) {
    return NextResponse.json({ error: "Invalid email or password.", code: "INVALID_CREDENTIALS" }, { status: 401 });
  }

  const token = await createSessionToken({ userId: user.id, email: user.email });
  await setSessionCookie(token);
  return NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } });
}
