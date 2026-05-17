import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

function isPublicAsset(pathname: string) {
  return (
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    /\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|mp4|webm)$/i.test(pathname)
  );
}

function jwtSecretBytes(secret: string | undefined) {
  if (!secret || secret.length < 32) return null;
  return new TextEncoder().encode(secret);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicAsset(pathname)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    if (pathname.startsWith("/admin/login")) {
      return NextResponse.next();
    }
    const key = jwtSecretBytes(process.env.JWT_SECRET);
    if (!key) {
      return NextResponse.redirect(new URL("/admin/login?error=config", request.url));
    }
    const token = request.cookies.get("omanphoto_session")?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    try {
      await jwtVerify(token, key, { algorithms: ["HS256"] });
      return NextResponse.next();
    } catch {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  if (pathname.startsWith("/api/admin")) {
    const key = jwtSecretBytes(process.env.JWT_SECRET);
    if (!key) {
      return NextResponse.json({ error: "Server misconfiguration: JWT_SECRET" }, { status: 503 });
    }
    const token = request.cookies.get("omanphoto_session")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
      await jwtVerify(token, key, { algorithms: ["HS256"] });
      return NextResponse.next();
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  if (pathname === "/sitemap.xml" || pathname === "/robots.txt") {
    return NextResponse.next();
  }

  if (pathname === "/") {
    // Preserve query string (e.g. ?utm_source=ads) so marketing attribution survives the redirect.
    // The URL fragment (#hash) is never sent to the server, but per RFC 7231 the browser
    // re-applies the original fragment to the redirect target automatically.
    const url = request.nextUrl.clone();
    url.pathname = "/en";
    return NextResponse.redirect(url);
  }

  const hasLocale = pathname === "/en" || pathname === "/ar" || pathname.startsWith("/en/") || pathname.startsWith("/ar/");
  if (!hasLocale) {
    return NextResponse.redirect(new URL(`/en${pathname}`, request.url));
  }

  const response = NextResponse.next();
  // Avoid stale HTML at CDNs/browsers when CMS content changes (Next revalidatePath + fresh RSC data).
  response.headers.set("Cache-Control", "private, no-cache, no-store, max-age=0, must-revalidate");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
