import type { Metadata } from "next";
import Script from "next/script";
import { Cormorant_Garamond, DM_Sans, Noto_Sans_Arabic } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-cormorant",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-dm-sans",
  display: "swap",
});

const notoArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600"],
  variable: "--font-noto-arabic",
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
    <html lang="en" className={`${cormorant.variable} ${dmSans.variable} ${notoArabic.variable}`}>
      <body className="min-h-screen bg-paper antialiased text-ink">
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-712088539"
          strategy="beforeInteractive"
        />
        <Script id="google-ads-gtag" strategy="beforeInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-712088539');
          `}
        </Script>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3160854101704307"
          strategy="beforeInteractive"
          crossOrigin="anonymous"
        />
        {children}
      </body>
    </html>
  );
}
