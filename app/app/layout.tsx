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
        {children}
      </body>
    </html>
  );
}
