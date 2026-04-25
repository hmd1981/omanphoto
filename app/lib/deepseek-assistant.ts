import type { Locale } from "./locale";

/**
 * DeepSeek chat completion — Oman Photo sales assistant.
 *
 * SECURITY:
 * - This module is server-only. The runtime guard below throws if it is ever
 *   imported into a browser bundle (defense-in-depth so the API key cannot leak).
 * - DEEPSEEK_API_KEY must never reach the browser; only this module reads it.
 * - We never log full conversations (privacy), only success/failure counters via the API route.
 */
if (typeof window !== "undefined") {
  throw new Error("deepseek-assistant.ts must not be imported from client code");
}

export type AssistantRole = "user" | "assistant" | "system";

export type AssistantMessage = {
  role: AssistantRole;
  content: string;
};

export type AssistantPageContext = {
  path?: string;
  serviceSlug?: string;
  source?: string;
};

export type AssistantContext = {
  locale: Locale;
  pageContext?: AssistantPageContext;
  /**
   * How many user-role messages have been sent in this session, including the
   * current one. Used to escalate the system prompt: after 3+ turns we ask
   * the model to summarize intent and *always* return a CTA action.
   */
  userTurnCount?: number;
};

export type AssistantSuggestedAction =
  | "contact"
  | "book"
  | "ai-studio"
  | "services";

export type AssistantResult =
  | {
      ok: true;
      reply: string;
      suggestedAction?: AssistantSuggestedAction;
    }
  | {
      ok: false;
      error: "missing_api_key" | "timeout" | "upstream_error" | "bad_response" | "empty_reply";
    };

const DEFAULT_MODEL = "deepseek-v4-flash";
const DEFAULT_BASE_URL = "https://api.deepseek.com";
const REQUEST_TIMEOUT_MS = 15_000;
const MAX_OUTPUT_TOKENS = 380;

const SERVICE_CATALOG_EN = [
  "Wedding Photography",
  "Event Coverage",
  "Fashion Photography",
  "Industrial Photography",
  "Commercial Photography",
  "Social Media Content / Reels",
  "Video Production",
  "AI Studio (AI-generated concepts and visuals)",
];

const SERVICE_CATALOG_AR = [
  "تصوير الأعراس",
  "تغطية الفعاليات",
  "تصوير الأزياء",
  "التصوير الصناعي",
  "التصوير التجاري",
  "محتوى السوشيال ميديا / ريلز",
  "إنتاج الفيديو",
  "AI Studio (مفاهيم وصور بالذكاء الاصطناعي)",
];

function buildSystemPrompt(ctx: AssistantContext): string {
  const isAr = ctx.locale === "ar";
  const services = (isAr ? SERVICE_CATALOG_AR : SERVICE_CATALOG_EN)
    .map((s) => `- ${s}`)
    .join("\n");

  const pageHint = ctx.pageContext?.path
    ? `\nCurrent page the visitor is on: ${ctx.pageContext.path}`
    : "";
  const serviceHint = ctx.pageContext?.serviceSlug
    ? `\nVisitor is viewing service slug: ${ctx.pageContext.serviceSlug}`
    : "";

  const turn = ctx.userTurnCount ?? 1;
  // After 3+ user turns the visitor has shared enough — we must stop probing
  // and route them. After 2 turns we may already nudge if intent is clear.
  const escalationBlock =
    turn >= 3
      ? `
ESCALATION — the visitor has now sent ${turn} messages in this session.
Their intent should be clear by now. You MUST:
1. Open your reply with one short sentence (max 14 words) that summarizes
   what the visitor is looking for, in ${isAr ? "Arabic" : "English"}.
2. Follow with one concrete next step that matches the routing rules above.
3. The "action" field MUST NOT be null. Pick the single best routing key.
   If unsure between two, prefer "contact" over "services".
`.trim()
      : turn === 2
        ? `
The visitor has sent 2 messages. If their intent is reasonably clear, set a
non-null "action" now rather than asking another probing question.
`.trim()
        : "";

  const baseRules = `
You are the Oman Photo sales assistant. Your tone is quiet, refined, professional —
editorial, not salesy. Keep replies short (2–4 sentences), warm, and concrete.

You ONLY answer questions about Oman Photo: its photography and video services,
booking, and AI Studio. If asked anything unrelated (politics, generic chat, coding,
math, news, recipes, gossip, anything outside the studio), politely steer the user
back to Oman Photo's services or invite them to contact the studio. Never improvise
unrelated answers.

Oman Photo services:
${services}

Operational facts:
- Booking requests are reviewed and confirmed manually by the studio team.
- Payment is handled offline / in person after a booking is confirmed.
- Pricing depends on scope, location, hours, deliverables and post-production.
  Never quote a final price. Always invite the visitor to share scope so the studio
  can prepare a tailored quote.
- Never claim a booking is confirmed. Never promise a specific date is available.
  Always treat availability as something the studio confirms after a booking request.

Sales routing rules — pick AT MOST ONE suggested action per reply:
- Reels, TikTok, Instagram content, short-form video, content creator work,
  monthly social packages   → service: Social Media Content / Reels OR Video Production
                                action: "book"
- Fashion campaigns, lookbooks, editorials, model shoots
                              → service: Fashion Photography           action: "book"
- Weddings, engagements, henna nights, marriage ceremonies
                              → service: Wedding Photography           action: "book"
- Brand campaigns, product, advertising, hotel/F&B/real-estate visuals
                              → service: Commercial Photography        action: "book"
- Corporate events, conferences, launches, government, gala
                              → service: Event Coverage                action: "book"
- Factory, plants, energy, oil & gas, technical site documentation
                              → service: Industrial Photography        action: "book"
- AI-generated concepts, AI portraits, AI mood frames, AI campaign ideation
                              → action: "ai-studio"
- General price / quote / "how much" questions
                              → action: "contact"
- General "what do you offer", overview, browsing
                              → action: "services"
- Direct human contact, urgent timelines, custom briefs
                              → action: "contact"

Routing destinations (the system will turn your action into a localized link):
- contact     → /${ctx.locale}/contact
- book        → /${ctx.locale}/book
- ai-studio   → /${ctx.locale}/ai-studio
- services    → /${ctx.locale}/services
${pageHint}${serviceHint}

${escalationBlock}

OUTPUT FORMAT — STRICT.
Reply with a single JSON object on one line, nothing else, no markdown fences:
{"reply":"<your message in ${isAr ? "Arabic" : "English"}>","action":"contact"|"book"|"ai-studio"|"services"|null}

Rules for the JSON:
- "reply" is plain text, no markdown, no links, no emojis.
- "reply" must be in ${isAr ? "Arabic" : "English"} regardless of the visitor's input language.
- "action" is the routing key from the table above, or null if no CTA is helpful.
- Do not output anything except this single JSON object.
`.trim();

  return baseRules;
}

type ChatChoice = { message?: { content?: string | null } };
type ChatResponse = { choices?: ChatChoice[] };

function safeParseAssistantJson(raw: string): {
  reply: string;
  action: AssistantSuggestedAction | null;
} | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Tolerate accidental markdown fences (```json ... ```) just in case.
  let candidate = trimmed;
  const fence = candidate.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fence?.[1]) candidate = fence[1].trim();

  // Tolerate stray text before/after by extracting the outermost JSON object.
  if (!candidate.startsWith("{")) {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start >= 0 && end > start) candidate = candidate.slice(start, end + 1);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(candidate);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const obj = parsed as Record<string, unknown>;
  const reply = typeof obj.reply === "string" ? obj.reply.trim() : "";
  if (!reply) return null;
  const actionRaw = obj.action;
  let action: AssistantSuggestedAction | null = null;
  if (
    actionRaw === "contact" ||
    actionRaw === "book" ||
    actionRaw === "ai-studio" ||
    actionRaw === "services"
  ) {
    action = actionRaw;
  }
  return { reply, action };
}

/**
 * Call DeepSeek chat completions with the Oman Photo sales prompt.
 * Returns a discriminated union — never throws for normal upstream failures.
 */
export async function callDeepSeekAssistant(
  messages: AssistantMessage[],
  context: AssistantContext,
): Promise<AssistantResult> {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (!apiKey) return { ok: false, error: "missing_api_key" };

  const model = process.env.DEEPSEEK_MODEL?.trim() || DEFAULT_MODEL;
  const baseUrl = (process.env.DEEPSEEK_BASE_URL?.trim() || DEFAULT_BASE_URL).replace(/\/+$/, "");
  const url = `${baseUrl}/chat/completions`;

  const systemPrompt = buildSystemPrompt(context);

  const body = {
    model,
    temperature: 0.4,
    max_tokens: MAX_OUTPUT_TOKENS,
    stream: false,
    messages: [
      { role: "system" as const, content: systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ],
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: "no-store",
    });
  } catch (err) {
    clearTimeout(timer);
    const aborted = (err as { name?: string } | null)?.name === "AbortError";
    return { ok: false, error: aborted ? "timeout" : "upstream_error" };
  }
  clearTimeout(timer);

  if (!res.ok) {
    return { ok: false, error: "upstream_error" };
  }

  let json: ChatResponse | null = null;
  try {
    json = (await res.json()) as ChatResponse;
  } catch {
    return { ok: false, error: "bad_response" };
  }

  const raw = json?.choices?.[0]?.message?.content?.trim() ?? "";
  if (!raw) return { ok: false, error: "empty_reply" };

  const parsed = safeParseAssistantJson(raw);
  if (parsed) {
    return {
      ok: true,
      reply: parsed.reply,
      suggestedAction: parsed.action ?? undefined,
    };
  }

  // Fallback: model didn't return JSON — still surface the natural-language reply
  // so the user gets something useful, with no CTA.
  return { ok: true, reply: raw };
}
