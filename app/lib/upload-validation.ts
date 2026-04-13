import path from "path";

const ALLOWED_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".mp4", ".webm"]);

const MAX_IMAGE = 15 * 1024 * 1024;
const MAX_VIDEO = 45 * 1024 * 1024;

export function extensionFromOriginalName(original: string): string | null {
  const ext = path.extname(original || "").toLowerCase();
  if (!ALLOWED_EXT.has(ext)) return null;
  return ext;
}

export function maxBytesForExtension(ext: string): number {
  if (ext === ".mp4" || ext === ".webm") return MAX_VIDEO;
  return MAX_IMAGE;
}

/** Verify binary matches declared extension (basic magic-byte check). */
export function validateFileSignature(buf: Buffer, ext: string): boolean {
  if (buf.length < 16) return false;
  if (ext === ".jpg" || ext === ".jpeg") {
    return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  }
  if (ext === ".png") {
    return buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
  }
  if (ext === ".webp") {
    return buf.slice(0, 4).toString() === "RIFF" && buf.slice(8, 12).toString() === "WEBP";
  }
  if (ext === ".mp4") {
    const ftyp = buf.slice(4, 8).toString();
    return ftyp === "ftyp";
  }
  if (ext === ".webm") {
    return buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3;
  }
  return false;
}

export { ALLOWED_EXT };
