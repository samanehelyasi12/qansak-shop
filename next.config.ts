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

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
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
