"use client";

import { useState } from "react";

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      className="mt-8 max-w-md space-y-6 border border-line p-8"
      onSubmit={async (e) => {
        e.preventDefault();
        setStatus("loading");
        setMessage(null);
        const res = await fetch("/api/admin/account/password", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
        });
        const json = (await res.json().catch(() => null)) as { error?: string } | null;
        setStatus(res.ok ? "success" : "error");
        if (res.ok) {
          setMessage("Password updated successfully.");
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
        } else {
          setMessage(json?.error ?? "Could not update password.");
        }
      }}
    >
      <h2 className="text-sm uppercase tracking-[0.25em] text-muted">Change password</h2>
      <p className="text-xs text-neutral-500">
        Strong passwords: at least 12 characters with letters, numbers, and a symbol. The literal <code className="text-neutral-400">admin</code> is allowed if you keep the default studio credential.
      </p>
      <label className="block">
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted">Current password</span>
        <input
          type="password"
          autoComplete="current-password"
          required
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="mt-2 w-full border border-line bg-black px-4 py-3 text-sm"
        />
      </label>
      <label className="block">
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted">New password</span>
        <input
          type="password"
          autoComplete="new-password"
          required
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="mt-2 w-full border border-line bg-black px-4 py-3 text-sm"
        />
      </label>
      <label className="block">
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted">Confirm new password</span>
        <input
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="mt-2 w-full border border-line bg-black px-4 py-3 text-sm"
        />
      </label>
      <button
        type="submit"
        disabled={status === "loading"}
        className="border border-white px-8 py-3 text-xs uppercase tracking-[0.25em] hover:bg-white hover:text-black disabled:opacity-50"
      >
        {status === "loading" ? "Updating…" : "Update password"}
      </button>
      {message ? (
        <p className={`text-sm ${status === "success" ? "text-neutral-300" : "text-amber-200"}`}>{message}</p>
      ) : null}
    </form>
  );
}
