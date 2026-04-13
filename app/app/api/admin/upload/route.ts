import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import path from "path";
import { writeFile } from "fs/promises";
import { requireAdminUser } from "@/lib/admin-api";
import { ensureUploadDir, getUploadRoot } from "@/lib/uploads";
import { extensionFromOriginalName, maxBytesForExtension, validateFileSignature } from "@/lib/upload-validation";

export async function POST(request: Request) {
  const gate = await requireAdminUser();
  if ("error" in gate) return gate.error;

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file", code: "NO_FILE" }, { status: 400 });
  }

  const original = file.name || "upload.bin";
  const ext = extensionFromOriginalName(original);
  if (!ext) {
    return NextResponse.json(
      { error: "Unsupported file type. Use JPG, PNG, WebP, MP4, or WebM.", code: "BAD_EXT" },
      { status: 400 },
    );
  }

  const maxBytes = maxBytesForExtension(ext);
  if (file.size > maxBytes) {
    return NextResponse.json(
      { error: `File too large (max ${Math.round(maxBytes / (1024 * 1024))}MB for this type).`, code: "TOO_LARGE" },
      { status: 400 },
    );
  }

  if (file.size === 0) {
    return NextResponse.json({ error: "Empty file", code: "EMPTY" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!validateFileSignature(buffer, ext)) {
    return NextResponse.json({ error: "File content does not match the declared type.", code: "BAD_SIGNATURE" }, { status: 400 });
  }

  const storedName = `${randomUUID()}${ext}`;
  await ensureUploadDir();
  await writeFile(path.join(getUploadRoot(), storedName), buffer);

  return NextResponse.json({
    filePath: storedName,
    publicUrl: `/api/media/file/${encodeURIComponent(storedName)}`,
  });
}
