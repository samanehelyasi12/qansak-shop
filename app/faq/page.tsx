import type { Metadata } from "next";
import FAQ from "@/components/home/FAQ";

/**
 * مسیر /faq — از همان کامپوننت و همان محتوای واقعی صفحهٔ اصلی استفاده می‌کند
 * تا بدون هیچ تغییری در طراحی، لینک فوتر کار کند.
 */

// Metadata only — the visible FAQ block is untouched. Without this the page
// would inherit the homepage title/description and create a duplicate.
export const metadata: Metadata = {
  title: "سوالات متداول",
  description:
    "پاسخ پرسش‌های رایج درباره تازگی و دست‌ساز بودن محصولات قندک، نحوه ثبت سفارش، محدوده و زمان ارسال، مزایای عضویت و مواد اولیه مورد استفاده.",
};

export default function FaqPage() {
  return (
    <>
      {/*
        صفحهٔ /faq فقط همین کامپوننت را رندر می‌کند و خودش <h1> نداشت.
        این عنوان فقط-خوانده‌شونده دقیقاً همان متن عنوانِ قابل‌مشاهدهٔ پایین است،
        پس سلسله‌مراتب برای صفحه‌خوان و موتور جست‌وجو درست می‌شود
        بدون هیچ تغییری در ظاهر.
      */}
      <h1 className="sr-only">سوالات متداول</h1>
      <FAQ />
    </>
  );
}
