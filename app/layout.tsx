import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "@/app/globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

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
  title: "قندک | شیرینی‌سرای آنلاین",
  description: "سفارش آنلاین کیک، شیرینی، نان و شکلات دست‌ساز تازه از شیرینی‌سرای قندک",
  keywords: "کیک، شیرینی، نان، شکلات، سفارش آنلاین، قندک",
  authors: [{ name: "قندک" }],
  openGraph: {
    title: "قندک | شیرینی‌سرای آنلاین",
    description: "سفارش آنلاین کیک، شیرینی، نان و شکلات دست‌ساز تازه",
    type: "website",
    locale: "fa_IR",
    siteName: "قندک",
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
        <Header />
        <main className="flex-1 rounded-t-3xl border border-qandek-pink/40 border-t-0 -mt-px">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}