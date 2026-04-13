import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  /** HS256 signing key — use a long random string (e.g. openssl rand -base64 48). */
  JWT_SECRET: z.string().min(32),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional().default("http://localhost:3000"),
  UPLOAD_DIR: z.string().optional().default("/opt/omanphoto/uploads"),
});

export type Env = z.infer<typeof schema>;

export function getEnv(): Env {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Invalid environment: ${parsed.error.message}`);
  }
  return parsed.data;
}
