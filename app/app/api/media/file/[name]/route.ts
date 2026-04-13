import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { safeJoinUploads } from "@/lib/uploads";

type Params = { params: Promise<{ name: string }> };

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

export async function GET(_request: Request, ctx: Params) {
  const { name } = await ctx.params;
  const decoded = decodeURIComponent(name);
  if (decoded.includes("..") || decoded.includes("/") || decoded.includes("\\")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    const full = safeJoinUploads(decoded);
    const buf = await readFile(full);
    const ext = path.extname(decoded).toLowerCase();
    const contentType = MIME[ext] ?? "application/octet-stream";
    return new NextResponse(buf, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
