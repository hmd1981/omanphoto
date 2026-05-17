/** Parse FAQ stored as `Q: …\nA: …` blocks separated by blank lines. */
export function parseFaqBlocks(raw: string | null | undefined): { question: string; answer: string }[] {
  if (!raw?.trim()) return [];
  const blocks = raw.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  const out: { question: string; answer: string }[] = [];
  for (const block of blocks) {
    const match = block.match(/^Q:\s*([\s\S]*?)\nA:\s*([\s\S]*)$/i);
    if (match) {
      out.push({ question: match[1].trim(), answer: match[2].trim() });
    }
  }
  return out;
}
