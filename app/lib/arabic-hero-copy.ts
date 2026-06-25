/**
 * Presentation-layer polish for Arabic hero copy (not CMS).
 * Editorial micro-typography: punctuation, quotes, line balance.
 */
const NBSP = "\u00A0";
const AR_QUOTE_OPEN = "\u00AB"; // «
const AR_QUOTE_CLOSE = "\u00BB"; // »

export function polishArabicHeroCopy(text: string): string {
  return text
    .trim()
    .replace(/\.{3}/g, "…")
    .replace(/"([^"]+)"/g, `${AR_QUOTE_OPEN}$1${AR_QUOTE_CLOSE}`)
    .replace(/\s*[-–—]\s*/g, " — ")
    .replace(/\s+/g, " ")
    .replace(/\s+([،؛؟!.])/g, "$1");
}

/** Editorially balanced headline lines — manual rhythm over automatic wrapping. */
export function balanceArabicHeroHeadline(text: string): string[] {
  const polished = polishArabicHeroCopy(text);

  if (polished.includes("مو أي تصوير")) {
    return ["مو أي تصوير…", "هذا شغل يُصنع بذوق."];
  }

  const idx = polished.indexOf("…");
  if (idx !== -1) {
    const lead = polished.slice(0, idx + 1).trim();
    const rest = polished.slice(idx + 1).trim();
    return rest ? [lead, rest] : [lead];
  }

  const words = polished.split(" ");
  if (words.length <= 3) return [polished];

  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
}

/** Subline split at em-dash with orphan protection on the final phrase. */
export function balanceArabicHeroSubline(text: string): string[] {
  const polished = polishArabicHeroCopy(text);

  if (polished.includes(" — ")) {
    const [first, ...rest] = polished.split(" — ");
    const second = rest.join(" — ").trim();
    if (second) {
      const words = second.split(" ");
      if (words.length >= 3) {
        const tail = words.splice(-2).join(NBSP);
        return [first, `— ${words.join(" ")} ${tail}`.trim()];
      }
      return [first, `— ${second}`];
    }
  }

  return [bindArabicOrphans(polished)];
}

function bindArabicOrphans(line: string): string {
  const words = line.split(" ");
  if (words.length < 4) return line;
  const last = words.pop()!;
  const before = words.pop()!;
  words.push(`${before}${NBSP}${last}`);
  return words.join(" ");
}
