import type { NextConfig } from "next";

/**
 * هدرهای امنیتی سمت فرانت‌اند.
 *
 * عمداً فقط هدرهای «بی‌خطر» اضافه شده‌اند: هیچ‌کدام رفتار یا ظاهر برنامه را
 * تغییر نمی‌دهند و هیچ قاعده‌ای را نمی‌شکنند.
 *
 * دربارهٔ CSP: یک CSP سخت‌گیرانه برای این پروژه به کاربردهای اختصاصی نیاز دارد
 * (inline style اسکریپت‌های styled-jsx در Header، JSON-LD، و nonce برای اسکریپت‌های
 * Next.js). اعمال کورکورانهٔ آن ریسک شکستن صفحه دارد، بنابراین در این مرحله اعمال
 * نشده و به‌عنوان کار آینده به تعویق افتاده است.
 */
const securityHeaders = [
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    // جلوگیری از قرار دادن سایت در iframe (clickjacking)
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'",
  },
  {
    // مجوزهای محدود و کم‌خطر: دوربین/میکروفون/ژئولوکیشن و… که سایت استاتیک
    // قندک به آن‌ها نیازی ندارد و فقط قابلیت‌های مرورگر را کم می‌کند.
    key: "Permissions-Policy",
    value: [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "payment=()",
      "usb=()",
      "magnetometer=()",
      "accelerometer=()",
      "gyroscope=()",
    ].join(", "),
  },
];

/**
 * The API origin, derived from the same public variable the client uses.
 *
 * Catalogue images are served by Django as absolute URLs, so `next/image`
 * needs permission to fetch from that host. Parsing it here keeps a single
 * source of truth: changing NEXT_PUBLIC_API_BASE_URL updates the client, the
 * server fetch and the image allowlist together.
 */
const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim().replace(/\/+$/, "") ??
  "http://localhost:8000";

let apiRemotePattern: { protocol: "http" | "https"; hostname: string; port: string };
try {
  const parsed = new URL(apiBaseUrl);
  apiRemotePattern = {
    protocol: parsed.protocol.replace(":", "") as "http" | "https",
    hostname: parsed.hostname,
    port: parsed.port || (parsed.protocol === "https:" ? "443" : "80"),
  };
} catch {
  apiRemotePattern = {
    protocol: "http",
    hostname: "localhost",
    port: "8000",
  };
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [apiRemotePattern],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
