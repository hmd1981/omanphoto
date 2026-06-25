import type { Metadata } from "next";
import { Amiri, Cormorant_Garamond, IBM_Plex_Sans_Arabic, Libre_Franklin, Noto_Naskh_Arabic, Tajawal } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const libreFranklin = Libre_Franklin({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-sans-en",
  display: "swap",
});

const amiri = Amiri({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-display-ar",
  display: "swap",
});

const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["300", "400", "500"],
  variable: "--font-hero-ui-ar",
  display: "swap",
});

const notoNaskhArabic = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500"],
  variable: "--font-hero-ar",
  display: "swap",
});

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["300", "400", "500"],
  variable: "--font-sans-ar",
  display: "swap",
});

/** Baked at Docker `next build` via --build-arg; local `next dev` uses dev placeholders. */
const buildId = (process.env.NEXT_PUBLIC_BUILD_ID ?? "").trim() || "dev";
const buildTime = (process.env.NEXT_PUBLIC_BUILD_TIME ?? "").trim() || "dev";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Oman Photo — Luxury Photography",
    template: "%s — Oman Photo",
  },
  description:
    "Editorial wedding, event, industrial, and commercial photography. Muscat. Black & white. Appointment only.",
  openGraph: {
    siteName: "Oman Photo",
    type: "website",
    locale: "en_OM",
  },
  /** Machine-checkable deploy fingerprint (curl | grep ai-studio). Baked at `docker compose build`. */
  other: {
    omanphoto_deploy: `ai-studio booking:/en/contact,/ar/contact build:${buildId} t:${buildTime}`,
    "google-adsense-account": "ca-pub-3160854101704307",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${libreFranklin.variable} ${amiri.variable} ${ibmPlexSansArabic.variable} ${notoNaskhArabic.variable} ${tajawal.variable}`}
    >
      <body className="min-h-screen bg-paper antialiased text-ink">
        {children}
      </body>
    </html>
  );
}
