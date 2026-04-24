"use client";

export type AdminFetchError = {
  route: string;
  message: string;
  status?: number;
};

export async function adminFetchJson<T>(route: string): Promise<T> {
  const res = await fetch(route, { credentials: "same-origin" });
  const text = await res.text();
  let json: unknown = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      throw {
        route,
        status: res.status,
        message: `Expected JSON from ${route}, received ${text.slice(0, 140)}`,
      } satisfies AdminFetchError;
    }
  }
  if (!res.ok) {
    const msg =
      json && typeof json === "object" && "error" in json && typeof json.error === "string"
        ? json.error
        : `HTTP ${res.status}`;
    throw { route, status: res.status, message: msg } satisfies AdminFetchError;
  }
  return json as T;
}

export function adminFetchErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "route" in error && "message" in error) {
    const e = error as AdminFetchError;
    return `${e.route}: ${e.message}${e.status ? ` (HTTP ${e.status})` : ""}`;
  }
  return error instanceof Error ? error.message : "Unknown admin API error";
}
