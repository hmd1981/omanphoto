"use client";

import { useMemo, useState } from "react";
import { z } from "zod";
import type { Locale } from "@/lib/locale";
import type { ContactFormCopy } from "@/lib/contact-messages";

type FieldErrors = Partial<Record<"name" | "phone" | "email" | "service" | "date" | "message", string>>;

export function ContactForm({
  locale,
  serviceOptions,
  copy,
  defaultServiceSlug,
}: {
  locale: Locale;
  serviceOptions: { value: string; label: string }[];
  copy: ContactFormCopy;
  /** When set and matches a published service slug, pre-selects the service field. */
  defaultServiceSlug?: string;
}) {
  const schema = useMemo(
    () =>
      z.object({
        name: z.string().trim().min(2, copy.errors.nameShort).max(120),
        phone: z
          .string()
          .trim()
          .min(6, copy.errors.phoneInvalid)
          .max(32)
          .regex(/^[\d\s+().-]+$/, copy.errors.phoneChars),
        email: z.string().trim().email(copy.errors.emailInvalid),
        service: z.string().optional(),
        date: z.string().optional(),
        message: z.string().trim().min(10, copy.errors.messageShort).max(8000),
        _hp: z.string().max(0),
      }),
    [copy],
  );

  const options = serviceOptions.length
    ? [...serviceOptions, { value: "other", label: locale === "ar" ? "أخرى" : "Other" }]
    : [];

  const serviceDefault = useMemo(() => {
    if (!defaultServiceSlug) return "";
    return serviceOptions.some((o) => o.value === defaultServiceSlug) ? defaultServiceSlug : "";
  }, [defaultServiceSlug, serviceOptions]);

  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setFieldErrors({});
    setErrorMessage(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const raw = {
      name: String(fd.get("name") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      email: String(fd.get("email") ?? ""),
      service: String(fd.get("service") ?? ""),
      date: String(fd.get("date") ?? ""),
      message: String(fd.get("message") ?? ""),
      _hp: String(fd.get("_hp") ?? ""),
    };
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !next[key as keyof FieldErrors]) {
          next[key as keyof FieldErrors] = issue.message;
        }
      }
      setFieldErrors(next);
      setStatus("idle");
      return;
    }
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...parsed.data, locale }),
    });
    if (res.status === 429) {
      setErrorMessage(copy.errorRateLimit);
      setStatus("error");
      return;
    }
    if (!res.ok) {
      const j = (await res.json().catch(() => null)) as { fieldErrors?: Record<string, string[]> } | null;
      if (j?.fieldErrors) {
        const fe: FieldErrors = {};
        for (const [k, v] of Object.entries(j.fieldErrors)) {
          if (v?.[0]) fe[k as keyof FieldErrors] = v[0];
        }
        setFieldErrors(fe);
      }
      setErrorMessage(copy.errorGeneric);
      setStatus("error");
      return;
    }
    setStatus("done");
    form.reset();
  }

  const inputClass =
    "mt-3 min-h-[48px] w-full border bg-surface px-4 py-3.5 text-[15px] leading-normal text-ink-bright placeholder:text-muted-soft focus:outline-none transition-colors md:text-sm";
  const borderOk = "border-line/80 focus:border-ink-bright/50";
  const borderErr = "border-red-900/80 focus:border-red-700/80";

  return (
    <form onSubmit={onSubmit} className="relative mt-8 grid gap-7 md:mt-10 md:grid-cols-2 md:gap-9" noValidate>
      <label className="block md:col-span-1">
        <span className="text-[10px] uppercase tracking-[0.28em] text-muted">{copy.name}</span>
        <input
          name="name"
          autoComplete="name"
          className={`${inputClass} ${fieldErrors.name ? borderErr : borderOk}`}
          placeholder={copy.namePlaceholder}
        />
        {fieldErrors.name ? <p className="mt-2 text-xs text-muted">{fieldErrors.name}</p> : null}
      </label>
      <label className="block md:col-span-1">
        <span className="text-[10px] uppercase tracking-[0.28em] text-muted">{copy.phone}</span>
        <input
          name="phone"
          autoComplete="tel"
          className={`${inputClass} ${fieldErrors.phone ? borderErr : borderOk}`}
          placeholder={copy.phonePlaceholder}
        />
        {fieldErrors.phone ? <p className="mt-2 text-xs text-muted">{fieldErrors.phone}</p> : null}
      </label>
      <label className="block md:col-span-2">
        <span className="text-[10px] uppercase tracking-[0.28em] text-muted">{copy.email}</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          className={`${inputClass} ${fieldErrors.email ? borderErr : borderOk}`}
          placeholder={copy.emailPlaceholder}
        />
        {fieldErrors.email ? <p className="mt-2 text-xs text-muted">{fieldErrors.email}</p> : null}
      </label>
      <label className="block md:col-span-1">
        <span className="text-[10px] uppercase tracking-[0.28em] text-muted">{copy.service}</span>
        <select name="service" className={`${inputClass} ${borderOk}`} defaultValue={serviceDefault}>
          <option value="" disabled>
            {copy.selectService}
          </option>
          {options.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block md:col-span-1">
        <span className="text-[10px] uppercase tracking-[0.28em] text-muted">{copy.date}</span>
        <input name="date" type="date" className={`${inputClass} ${borderOk}`} />
      </label>
      <label className="block md:col-span-2">
        <span className="text-[10px] uppercase tracking-[0.28em] text-muted">{copy.message}</span>
        <textarea
          name="message"
          rows={6}
          className={`${inputClass} !min-h-[140px] resize-y md:!min-h-[160px] ${fieldErrors.message ? borderErr : borderOk}`}
          placeholder={copy.messagePlaceholder}
        />
        {fieldErrors.message ? <p className="mt-2 text-xs text-muted">{fieldErrors.message}</p> : null}
      </label>
      <input
        type="text"
        name="_hp"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 h-px w-px opacity-0"
        defaultValue=""
      />
      <div className="md:col-span-2">
        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full min-h-[52px] border border-ink-bright/50 px-10 py-4 text-[10px] uppercase tracking-[0.36em] text-ink-bright transition-colors duration-500 hover:bg-ink-bright hover:text-paper disabled:opacity-40 md:w-auto md:min-w-[16rem]"
        >
          {status === "loading" ? copy.sending : copy.submit}
        </button>
        {status === "done" ? (
          <div className="mt-8 flex items-start gap-4 border border-line/80 bg-surface px-6 py-5">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-ink-bright/60 text-[10px] text-ink-bright">✓</span>
            <div>
              <p className="text-sm font-light text-ink-bright">{copy.successTitle}</p>
              <p className="mt-2 text-sm font-light text-ink-muted">{copy.successBody}</p>
            </div>
          </div>
        ) : null}
        {status === "error" ? (
          <p className="mt-6 text-sm font-light text-ink-muted">{errorMessage ?? copy.errorGeneric}</p>
        ) : null}
      </div>
    </form>
  );
}
