import fs from "fs/promises";
import path from "path";
import { getEnv } from "./env";

export function getUploadRoot(): string {
  return path.resolve(getEnv().UPLOAD_DIR ?? "/opt/omanphoto/uploads");
}

export async function ensureUploadDir(): Promise<void> {
  await fs.mkdir(getUploadRoot(), { recursive: true });
}

export function publicUploadUrl(storedName: string): string {
  return `/api/media/file/${encodeURIComponent(storedName)}`;
}

export function safeJoinUploads(filename: string): string {
  const base = getUploadRoot();
  const resolved = path.resolve(base, filename);
  if (!resolved.startsWith(base)) {
    throw new Error("Invalid path");
  }
  return resolved;
}
