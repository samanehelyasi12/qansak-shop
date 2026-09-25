import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "@/app/globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { CartProvider } from "@/lib/cart/store";
import {
  absoluteUrl,
  siteLogoHeight,
  siteLogoPath,
  siteLogoWidth,
  siteName,
  siteUrl,
} from "@/lib/site";
import SiteJsonLd from "@/components/seo/SiteJsonLd";

/** Existing brand asset — no new visual asset is created for this batch. */
const defaultOgImage = {
  url: absoluteUrl(siteLogoPath),
  width: siteLogoWidth,
  height: siteLogoHeight,
  alt: siteName,
};

const molsaqArabic = localFont({
  src: [
    { path: "./fonts/MolsaqArabic-ExtraLight.ttf", weight: "200", style: "normal" },
    { path: "./fonts/MolsaqArabic-Light.ttf", weight: "300", style: "normal" },
    { path: "./fonts/MolsaqArabic-ExtraBold.ttf", weight: "800", style: "normal" },
  ],
  variable: "--font-molsaq-arabic",
  display: "swap",
});

const sgKara = localFont({
  src: "./fonts/SGKara-Light.ttf",
  weight: "300",
  variable: "--font-sgkara",
  display: "swap",
});

export const metadata: Metadata = {
  // Base for resolving every relative metadata URL (canonical, OG images, ...).
  // Configure the real domain via NEXT_PUBLIC_SITE_URL — see lib/site.ts.
  metadataBase: new URL(siteUrl),
  // `default` is used by the homepage; `template` appends the brand to every
  // child page, so page files only declare their page-specific title.
  title: {
    default: "قندک | شیرینی‌سرای آنلاین",
    template: "%s | قندک",
  },
  description: "سفارش آنلاین کیک، شیرینی، نان و شکلات دست‌ساز تازه از شیرینی‌سرای قندک",
  authors: [{ name: "قندک" }],
  // Relative "./" resolves per-route, so every public page gets its own
  // self-referencing canonical without touching each page file.
  alternates: {
    canonical: "./",
  },
  openGraph: {
    title: "قندک | شیرینی‌سرای آنلاین",
    description: "سفارش آنلاین کیک، شیرینی، نان و شکلات دست‌ساز تازه",
    type: "website",
    locale: "fa_IR",
    siteName,
    url: "./",
    images: [defaultOgImage],
  },
  twitter: {
    card: "summary_large_image",
    title: "قندک | شیرینی‌سرای آنلاین",
    description: "سفارش آنلاین کیک، شیرینی، نان و شکلات دست‌ساز تازه",
    images: [defaultOgImage.url],
  },
};

export const viewport: Viewport = {
  themeColor: "#FDF8F3",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      <body className={`min-h-screen flex flex-col bg-white ${molsaqArabic.variable} ${sgKara.variable}`}>
        <CartProvider>
          <SiteJsonLd />
          <Header />
          <main className="flex-1 rounded-t-3xl border border-qandek-pink/40 border-t-0 -mt-px">
            {children}
          </main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}