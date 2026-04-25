import { NextResponse } from "next/server";
import { z } from "zod";
import {
  callDeepSeekAssistant,
  type AssistantMessage,
  type AssistantSuggestedAction,
} from "@/lib/deepseek-assistant";
import { localizedPath } from "@/lib/locale";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ASSISTANT_WINDOW_MS = 60 * 60 * 1000;
const ASSISTANT_MAX = 20;
const MESSAGE_MAX = 1200;
const HISTORY_MAX = 8;

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(MESSAGE_MAX),
});

const bodySchema = z.object({
  locale: z.enum(["en", "ar"]),
  message: z.string().trim().min(1).max(MESSAGE_MAX),
  history: z.array(messageSchema).max(HISTORY_MAX).optional(),
  pageContext: z
    .object({
      path: z.string().max(512).optional(),
      serviceSlug: z.string().max(120).optional(),
      source: z.string().max(120).optional(),
    })
    .optional(),
});

function ctaHrefFor(action: AssistantSuggestedAction, locale: "en" | "ar"): string {
  switch (action) {
    case "contact":
      return localizedPath(locale, "/contact");
    case "book":
      return localizedPath(locale, "/book");
    case "ai-studio":
      return localizedPath(locale, "/ai-studio");
    case "services":
      return localizedPath(locale, "/services");
  }
}

/** Privacy-conscious: log only category, no message contents. */
function logEvent(kind: "ok" | "rate_limited" | "validation_error" | "upstream_error" | "missing_api_key") {
  // Single short tag, no PII, no message text.
  console.log(`[assistant] ${kind}`);
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limited = rateLimit(`assistant:${ip}`, ASSISTANT_MAX, ASSISTANT_WINDOW_MS);
  if (!limited.ok) {
    logEvent("rate_limited");
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    logEvent("validation_error");
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  const { locale, message, history, pageContext } = parsed.data;

  // Build the conversation we send upstream. The history is already capped
  // to 8 by the schema; together with the current message we stay <= 9, but
  // the client always trims to MAX_HISTORY-1 so total <= 8 in practice.
  const messages: AssistantMessage[] = [
    ...(history ?? []),
    { role: "user", content: message },
  ];

  // How many user-role turns has this visitor sent in this session, including
  // the current one? Drives both the system-prompt escalation and the
  // server-side CTA fallback below.
  const userTurnCount =
    (history ?? []).filter((m) => m.role === "user").length + 1;

  const result = await callDeepSeekAssistant(messages, {
    locale,
    pageContext,
    userTurnCount,
  });

  if (!result.ok) {
    if (result.error === "missing_api_key") {
      logEvent("missing_api_key");
      return NextResponse.json(
        { ok: false, error: "assistant_unavailable" },
        { status: 503 },
      );
    }
    logEvent("upstream_error");
    return NextResponse.json(
      { ok: false, error: "assistant_unavailable" },
      { status: 502 },
    );
  }

  // Safety net: after 3+ user turns we promised the visitor a clear next
  // step. If the model still refused to pick an action, default to /contact
  // so the user is never left without a route.
  let suggestedAction = result.suggestedAction;
  if (!suggestedAction && userTurnCount >= 3) {
    suggestedAction = "contact";
  }

  logEvent("ok");
  return NextResponse.json({
    ok: true,
    reply: result.reply,
    suggestedAction,
    suggestedHref: suggestedAction ? ctaHrefFor(suggestedAction, locale) : undefined,
  });
}
