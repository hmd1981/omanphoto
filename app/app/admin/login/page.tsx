"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [configError, setConfigError] = useState(false);

  useEffect(() => {
    setConfigError(new URLSearchParams(window.location.search).get("error") === "config");
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-6">
      <div className="w-full max-w-md border border-line p-10">
        <h1 className="font-display text-3xl tracking-[0.1em]">Admin sign-in</h1>
        <p className="mt-4 text-sm text-muted">Oman Photo control panel</p>
        <p className="mt-6 text-[11px] uppercase tracking-[0.22em] text-muted">
          Public site (no login required)
        </p>
        <nav className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[11px] uppercase tracking-[0.2em]">
          <Link href="/en" className="text-white/80 underline-offset-4 hover:text-white hover:underline">
            Home
          </Link>
          <Link href="/en/ai-studio" className="text-white/80 underline-offset-4 hover:text-white hover:underline">
            AI Studio
          </Link>
          <Link href="/en/book" className="text-white/80 underline-offset-4 hover:text-white hover:underline">
            Book
          </Link>
        </nav>
        <p className="mt-6 text-xs leading-relaxed text-neutral-500">
          Protected URLs like <span className="text-neutral-400">/admin/page-heroes</span> redirect here until you sign in. After sign-in,{" "}
          <strong className="text-neutral-400">AI Studio</strong> and <strong className="text-neutral-400">Book</strong> also appear in the admin top bar.
        </p>
        <form
          className="mt-10 space-y-6"
          onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            setError(null);
            const fd = new FormData(e.currentTarget);
            const email = String(fd.get("email") ?? "");
            const password = String(fd.get("password") ?? "");
            const res = await fetch("/api/auth/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, password }),
            });
            setLoading(false);
            if (res.status === 429) {
              const j = (await res.json().catch(() => null)) as { retryAfterSec?: number } | null;
              const sec = j?.retryAfterSec ?? 60;
              setError(`Too many attempts. Try again in about ${sec} seconds.`);
              return;
            }
            if (!res.ok) {
              const j = (await res.json().catch(() => null)) as { error?: string } | null;
              setError(j?.error ?? "Invalid email or password.");
              return;
            }
            router.push("/admin");
            router.refresh();
          }}
        >
          <label className="block">
            <span className="text-xs uppercase tracking-[0.2em] text-muted">Email</span>
            <input
              name="email"
              type="email"
              autoComplete="username"
              required
              placeholder="admin@omanphoto.com"
              className="mt-2 w-full border border-line bg-black px-4 py-3 text-sm text-white focus:border-white focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-[0.2em] text-muted">Password</span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="mt-2 w-full border border-line bg-black px-4 py-3 text-sm text-white focus:border-white focus:outline-none"
            />
          </label>
          {configError ? (
            <p className="text-sm text-amber-200">
              Server configuration: set <code className="text-white">JWT_SECRET</code> to at least <strong>32</strong> random characters (e.g.{" "}
              <code className="text-white">openssl rand -base64 48</code>), then restart the app.
            </p>
          ) : null}
          {error ? <p className="text-sm text-neutral-400">{error}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full border border-white py-3 text-xs uppercase tracking-[0.25em] hover:bg-white hover:text-black disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
