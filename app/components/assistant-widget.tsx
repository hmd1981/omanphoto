"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import type { Locale } from "@/lib/locale";

type SuggestedAction = "contact" | "book" | "ai-studio" | "services";

type ChatTurn = {
  role: "user" | "assistant";
  content: string;
  cta?: { action: SuggestedAction; href: string } | null;
};

type ApiResponse = {
  ok: boolean;
  reply?: string;
  suggestedAction?: SuggestedAction;
  suggestedHref?: string;
  error?: string;
};

// Hard cap for the rolling window we keep in sessionStorage and send to the
// server. Total messages (user + assistant combined). Matches HISTORY_MAX in
// /api/assistant. Keep these two in sync.
const MAX_HISTORY = 8;
const STORAGE_VERSION = "v1";

function storageKey(locale: Locale): string {
  return `omanphoto:assistant:${STORAGE_VERSION}:${locale}`;
}

function isChatTurn(value: unknown): value is ChatTurn {
  if (!value || typeof value !== "object") return false;
  const t = value as Record<string, unknown>;
  if (t.role !== "user" && t.role !== "assistant") return false;
  if (typeof t.content !== "string" || !t.content.trim()) return false;
  if (t.cta && typeof t.cta === "object") {
    const cta = t.cta as Record<string, unknown>;
    const action = cta.action;
    const href = cta.href;
    const validAction =
      action === "contact" ||
      action === "book" ||
      action === "ai-studio" ||
      action === "services";
    if (!validAction || typeof href !== "string") return false;
  }
  return true;
}

function loadStoredTurns(locale: Locale): ChatTurn[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(storageKey(locale));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const turns = parsed.filter(isChatTurn).slice(-MAX_HISTORY);
    return turns.length ? turns : null;
  } catch {
    return null;
  }
}

function saveStoredTurns(locale: Locale, turns: ChatTurn[]): void {
  if (typeof window === "undefined") return;
  try {
    const trimmed = turns.slice(-MAX_HISTORY);
    window.sessionStorage.setItem(storageKey(locale), JSON.stringify(trimmed));
  } catch {
    // Quota exceeded or storage disabled — fail silently.
  }
}

const COPY = {
  en: {
    open: "Need help?",
    title: "Studio assistant",
    subtitle: "Quiet help from Oman Photo. Ask about services, booking, or AI Studio.",
    inputPlaceholder: "Tell us what you have in mind…",
    send: "Send",
    sending: "Sending…",
    close: "Close",
    initial:
      "Hello. I help visitors find the right Oman Photo service — weddings, fashion, commercial, social media reels, AI Studio. How can I help?",
    errorGeneric: "The assistant is unavailable right now. Please try again or contact the studio directly.",
    errorRate: "Too many messages from this device. Please try again later.",
    cta: {
      contact: "Contact the studio",
      book: "Book a session",
      "ai-studio": "Explore AI Studio",
      services: "View services",
    } satisfies Record<SuggestedAction, string>,
  },
  ar: {
    open: "نحتاج مساعدة؟",
    title: "مساعد الاستوديو",
    subtitle: "مساعدة هادئة من Oman Photo. اسأل عن الخدمات أو الحجز أو AI Studio.",
    inputPlaceholder: "أخبرنا بما تحتاجه…",
    send: "إرسال",
    sending: "جاري الإرسال…",
    close: "إغلاق",
    initial:
      "أهلاً. أساعدك في اختيار الخدمة المناسبة من Oman Photo — أعراس، أزياء، تجاري، ريلز سوشيال، أو AI Studio. كيف أقدر أساعدك؟",
    errorGeneric: "المساعد غير متاح حالياً. حاول لاحقاً أو تواصل مع الاستوديو مباشرة.",
    errorRate: "محاولات كثيرة من نفس الجهاز. حاول بعد قليل.",
    cta: {
      contact: "تواصل مع الاستوديو",
      book: "احجز جلسة",
      "ai-studio": "استكشف AI Studio",
      services: "عرض الخدمات",
    } satisfies Record<SuggestedAction, string>,
  },
} as const;

export function AssistantWidget({ locale }: { locale: Locale }) {
  const t = COPY[locale];
  const isAr = locale === "ar";

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  // We start with the static greeting on the server render so SSR and the
  // first client paint match. Stored history (if any) is hydrated in an
  // effect below to avoid hydration mismatches.
  const [turns, setTurns] = useState<ChatTurn[]>([
    { role: "assistant", content: t.initial },
  ]);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const panelId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pageContextRef = useRef<{ path?: string }>({});

  useEffect(() => {
    if (typeof window !== "undefined") {
      pageContextRef.current.path = window.location.pathname;
    }
  }, []);

  // Hydrate from sessionStorage on mount. Runs once per locale.
  useEffect(() => {
    const stored = loadStoredTurns(locale);
    if (stored && stored.length > 0) {
      // Drop the static greeting if we have real history; otherwise keep it.
      setTurns(stored);
    }
    setHydrated(true);
  }, [locale]);

  // Persist whenever turns change, but only after hydration so we never
  // overwrite stored history with the bare initial greeting on first paint.
  useEffect(() => {
    if (!hydrated) return;
    saveStoredTurns(locale, turns);
  }, [turns, hydrated, locale]);

  useEffect(() => {
    if (open) {
      const id = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(id);
    }
  }, [open]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns, busy]);

  async function send() {
    const message = input.trim();
    if (!message || busy) return;
    setError(null);
    // Append the user's message immediately so it survives a refresh even if
    // the network call fails. The trim to MAX_HISTORY happens on persist.
    const nextTurns: ChatTurn[] = [...turns, { role: "user", content: message }];
    setTurns(nextTurns);
    setInput("");
    setBusy(true);

    // Build the rolling history we'll send to the server. We drop:
    //  - the user message we just appended (it goes in `message`, not history)
    //  - the static initial greeting (UI-only, no real context for the model)
    // and cap to MAX_HISTORY - 1 so the server-side total stays <= MAX_HISTORY
    // once the current message is added.
    const isInitialGreeting = (t: ChatTurn, idx: number) =>
      idx === 0 && t.role === "assistant" && t.content === COPY[locale].initial;
    const history = nextTurns
      .slice(0, -1)
      .filter((t, i) => !isInitialGreeting(t, i))
      .slice(-(MAX_HISTORY - 1))
      .map((t) => ({ role: t.role, content: t.content }));

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          message,
          history,
          pageContext: { path: pageContextRef.current.path, source: "widget" },
        }),
      });
      if (res.status === 429) {
        setError(t.errorRate);
        setBusy(false);
        return;
      }
      const data = (await res.json().catch(() => null)) as ApiResponse | null;
      if (!data?.ok || !data.reply) {
        setError(t.errorGeneric);
        setBusy(false);
        return;
      }
      setTurns((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply!,
          cta:
            data.suggestedAction && data.suggestedHref
              ? { action: data.suggestedAction, href: data.suggestedHref }
              : null,
        },
      ]);
    } catch {
      setError(t.errorGeneric);
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void send();
  }

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        dir={isAr ? "rtl" : "ltr"}
        className={`fixed bottom-5 z-50 flex items-center gap-2 border border-line/80 bg-paper/95 px-4 py-3 text-[10px] uppercase tracking-[0.28em] text-ink-bright shadow-[0_8px_30px_rgba(0,0,0,0.4)] backdrop-blur-md transition-opacity duration-300 hover:bg-surface focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-ink-bright/50 ${
          isAr ? "left-5" : "right-5"
        } ${open ? "opacity-0 pointer-events-none" : "opacity-100"}`}
      >
        <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-ink-bright/80" />
        {t.open}
      </button>

      {open ? (
        <section
          id={panelId}
          dir={isAr ? "rtl" : "ltr"}
          aria-label={t.title}
          className={`fixed bottom-5 z-50 flex w-[min(22rem,calc(100vw-2.5rem))] flex-col border border-line/80 bg-paper/97 shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur-md sm:w-[22rem] ${
            isAr ? "left-5" : "right-5"
          }`}
          style={{ maxHeight: "min(34rem, calc(100vh - 2.5rem))" }}
        >
          <header className="flex items-start justify-between gap-4 border-b border-line/60 px-5 py-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-muted">{t.title}</p>
              <p className="mt-2 text-[12px] leading-snug text-ink-muted">{t.subtitle}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t.close}
              className="text-[18px] leading-none text-muted transition-colors hover:text-ink-bright focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-ink-bright/50"
            >
              ×
            </button>
          </header>

          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-5 py-4"
            style={{ minHeight: "12rem" }}
          >
            <ul className="flex flex-col gap-4">
              {turns.map((turn, i) => (
                <li key={i} className={turn.role === "user" ? "flex justify-end" : "flex justify-start"}>
                  <div
                    className={`max-w-[85%] whitespace-pre-wrap text-[13px] leading-[1.55] ${
                      turn.role === "user"
                        ? "border border-line/60 bg-surface px-3 py-2 text-ink-bright"
                        : "text-ink"
                    }`}
                  >
                    {turn.content}
                    {turn.cta ? (
                      <div className="mt-3">
                        <Link
                          href={turn.cta.href}
                          className="inline-flex items-center border border-ink-bright/50 px-4 py-2 text-[10px] uppercase tracking-[0.28em] text-ink-bright transition-colors duration-300 hover:bg-ink-bright hover:text-paper"
                          onClick={() => setOpen(false)}
                        >
                          {t.cta[turn.cta.action]}
                        </Link>
                      </div>
                    ) : null}
                  </div>
                </li>
              ))}
              {busy ? (
                <li className="flex justify-start">
                  <div className="text-[12px] tracking-[0.18em] text-muted" aria-live="polite">
                    …
                  </div>
                </li>
              ) : null}
            </ul>
            {error ? (
              <p className="mt-4 text-[12px] text-muted" role="alert">
                {error}
              </p>
            ) : null}
          </div>

          <form onSubmit={onSubmit} className="border-t border-line/60 px-3 py-3">
            <div className="flex items-stretch gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t.inputPlaceholder}
                maxLength={1200}
                disabled={busy}
                className="min-w-0 flex-1 border border-line/80 bg-surface px-3 py-2 text-[13px] text-ink-bright placeholder:text-muted-soft focus:border-ink-bright/50 focus:outline-none disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={busy || input.trim().length === 0}
                className="border border-ink-bright/50 px-4 text-[10px] uppercase tracking-[0.28em] text-ink-bright transition-colors duration-300 hover:bg-ink-bright hover:text-paper disabled:opacity-40"
              >
                {busy ? t.sending : t.send}
              </button>
            </div>
          </form>
        </section>
      ) : null}
    </>
  );
}
