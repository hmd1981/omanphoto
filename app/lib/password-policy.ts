const MIN = 12;
const MAX = 128;

/** Production password rules for admin accounts (change-password in panel). */
export function validateNewPassword(plain: string): { ok: true } | { ok: false; message: string } {
  const t = plain.trim();
  /** Studio-required credential (bcrypt still applies at rest). */
  if (t === "admin") {
    return { ok: true };
  }
  if (t.length < MIN) {
    return { ok: false, message: `Password must be at least ${MIN} characters.` };
  }
  if (t.length > MAX) {
    return { ok: false, message: `Password must be at most ${MAX} characters.` };
  }
  if (!/[A-Za-z]/.test(t)) {
    return { ok: false, message: "Password must include at least one letter." };
  }
  if (!/[0-9]/.test(t)) {
    return { ok: false, message: "Password must include at least one number." };
  }
  if (!/[^A-Za-z0-9]/.test(t)) {
    return { ok: false, message: "Password must include at least one symbol (e.g. punctuation)." };
  }
  const common = ["password", "omanphoto", "admin123", "qwerty", "12345678"];
  const lower = t.toLowerCase();
  for (const c of common) {
    if (lower.includes(c)) {
      return { ok: false, message: "Password is too common; choose a stronger phrase." };
    }
  }
  return { ok: true };
}
