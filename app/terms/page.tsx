import type { Metadata } from "next";
import Container from "@/components/ui/Container";
import TermsContent from "@/components/legal/TermsContent";

/**
 * مسیر /terms — محتوای واقعی قوانین (که پیش‌تر فقط داخل مودال ثبت‌نام بود)
 * را نمایش می‌دهد. از همان توکن‌های طراحی موجود پروژه استفاده شده است.
 */

// Metadata only — mirrors the page's own visible headings (شرایط استفاده،
// اطلاعات حساب، ثبت سفارش، پرداخت، ارسال و تحویل، لغو سفارش، حریم خصوصی).
export const metadata: Metadata = {
  title: "قوانین و مقررات",
  description:
    "شرایط استفاده از خدمات شیرینی‌سرای قندک: پذیرش شرایط، اطلاعات حساب کاربری، ثبت و لغو سفارش، پرداخت، ارسال و تحویل و حریم خصوصی.",
};

export default function TermsPage() {
  return (
    <div className="py-12 sm:py-16">
      <Container>
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-2 text-2xl font-bold text-cocoa sm:text-3xl">
            قوانین و مقررات
          </h1>

          <p className="mb-8 text-sm leading-7 text-cocoa/70 sm:text-base">
            شرایط استفاده از خدمات شیرینی‌سرای قندک
          </p>

          <div className="rounded-xl border border-cream bg-white p-6">
            <div className="text-sm leading-7 text-cocoa/70">
              <TermsContent />
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
