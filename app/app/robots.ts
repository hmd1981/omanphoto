import type { MetadataRoute } from "next";

const baseUrl = () => (process.env.NEXT_PUBLIC_SITE_URL ?? "https://omanphoto.com").replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  const base = baseUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/admin/"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
