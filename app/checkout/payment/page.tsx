"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Container from "@/components/ui/Container";
import CheckoutStepper from "@/components/checkout/CheckoutStepper";
import OrderSummary from "@/components/checkout/OrderSummary";

// TODO: این آیتم‌ها و مبلغ باید از همون داده‌ای بیان که در مرحله قبل (shipping) ذخیره شد
const cartItems = [
  { name: "کیک شکلاتی", quantity: 1, price: 385000, slug: "chocolate-cake" },
  { name: "کوکی شکلاتی", quantity: 2, price: 45000, slug: "chocolate-chip-cookie" },
];
const SHIPPING_COST = 30000;

export default function PaymentPage() {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [customerName, setCustomerName] = useState<string>("");

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("qandak_checkout_customer");
      if (stored) {
        const parsed = JSON.parse(stored);
        setCustomerName(`${parsed?.customer?.firstName ?? ""} ${parsed?.customer?.lastName ?? ""}`.trim());
      }
    } catch {
      // نادیده گرفتن خطای احتمالی
    }
  }, []);

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal + SHIPPING_COST;

  const handlePayWithZarinpal = async () => {
    setIsRedirecting(true);
    try {
      // ============================================================
      // TODO: اتصال واقعی به زرین‌پال (بعد از آماده شدن بک‌اند جنگو)
      // ------------------------------------------------------------
      // ۱. یک درخواست POST به اندپوینت جنگو بزنید، مثلاً:
      //      POST /api/payments/zarinpal/request/
      //      body: { amount: total, mobile: customer.phone, description: "پرداخت سفارش قندک" }
      //
      // ۲. جنگو سمت سرور با merchant_id به زرین‌پال وصل می‌شه (endpoint:
      //      https://payment.zarinpal.com/pg/v4/payment/request.json)
      //    و در پاسخ یک "authority" برمی‌گردونه.
      //
      // ۳. جنگو از روی authority یک payment_url می‌سازه:
      //      https://www.zarinpal.com/pg/StartPay/{authority}
      //    و اون رو به فرانت برمی‌گردونه.
      //
      // ۴. اینجا کاربر رو با ریدایرکت کامل (نه fetch) به اون آدرس می‌فرستید:
      //      window.location.href = data.payment_url
      //
      // ۵. بعد از پرداخت، زرین‌پال کاربر رو به callback_url جنگو برمی‌گردونه،
      //    جنگو تراکنش رو verify می‌کنه (/pg/v4/payment/verify.json) و در نهایت
      //    کاربر رو ریدایرکت می‌کنه به:
      //      /payment/result?order=ORD-XXXX&status=success یا failed
      //
      // فعلاً چون درگاه هنوز در بک‌اند فعال نیست، یک تأخیر مصنوعی می‌ذاریم
      // و مستقیم به صفحه نتیجه (حالت موفق) می‌ریم تا فلوی صفحات کامل دیده بشه:
      // ============================================================
      await new Promise((resolve) => setTimeout(resolve, 1400));
      router.push("/payment/result?order=ORD-12345");
    } finally {
      setIsRedirecting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#fff9f7]">
      <div className="pointer-events-none absolute inset-0 -z-0 hidden lg:block">
        <Image
          src="/images/decor/products-bg-desktop.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-white/45" />
      </div>
      <div className="pointer-events-none absolute inset-0 -z-0 lg:hidden">
        <Image
          src="/images/decor/products-bg-mobile.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-white/50" />
      </div>

      <div className="relative z-10 py-6 sm:py-10 lg:py-12">
        <Container>
          <div className="mx-auto max-w-2xl xl:max-w-7xl">
            <div className="mb-7 rounded-2xl border border-white/70 bg-white/80 px-3 py-4 shadow-sm backdrop-blur-md sm:px-6">
              <CheckoutStepper currentStep={3} />
            </div>

            <div className="mb-7">
              <p className="mb-1 text-sm font-medium text-caramel">قندک | خرید شما</p>
              <h1 className="text-2xl font-bold tracking-tight text-cocoa sm:text-3xl">پرداخت</h1>
            </div>

            <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
              {/* کارت اتصال به درگاه */}
              <section className="min-w-0 rounded-3xl border border-white/80 bg-white/90 p-6 text-center shadow-[0_16px_50px_rgba(80,40,30,0.08)] backdrop-blur-md sm:p-10">
                {customerName && (
                  <p className="mb-6 text-sm text-cocoa/60">
                    {customerName} عزیز، برای تکمیل سفارش به درگاه پرداخت امن متصل شوید.
                  </p>
                )}

                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#fff3ee]">
                  <svg className="h-10 w-10 text-caramel" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 8.25v10.5A2.25 2.25 0 0 0 4.5 21h15a2.25 2.25 0 0 0 2.25-2.25V8.25M2.25 8.25V6A2.25 2.25 0 0 1 4.5 3.75h15A2.25 2.25 0 0 1 21.75 6v2.25M6 15.75h3" />
                  </svg>
                </div>

                <h2 className="mb-2 text-xl font-bold text-cocoa">پرداخت امن با زرین‌پال</h2>
                <p className="mx-auto mb-8 max-w-sm text-sm leading-7 text-cocoa/60">
                  با کلیک روی دکمه زیر به درگاه پرداخت زرین‌پال منتقل می‌شوید. اطلاعات
                  کارت شما مستقیماً نزد بانک ثبت می‌شود و در سرورهای قندک ذخیره نمی‌شود.
                </p>

                <button
                  type="button"
                  onClick={handlePayWithZarinpal}
                  disabled={isRedirecting}
                  className="mx-auto flex w-full max-w-xs items-center justify-center gap-2 rounded-xl bg-caramel py-3.5 text-base font-medium text-white transition-colors hover:bg-cocoa disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isRedirecting ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      در حال اتصال به درگاه...
                    </>
                  ) : (
                    <>پرداخت {total.toLocaleString("fa-IR")} تومان</>
                  )}
                </button>

                <p className="mt-4 text-xs text-cocoa/40">
                  نماد اعتماد الکترونیکی و لوگوی زرین‌پال بعد از فعال‌سازی درگاه، اینجا نمایش داده می‌شود.
                </p>
              </section>

              {/* خلاصه سفارش، با دکمه بازگشت به مرحله اطلاعات ارسال */}
              <aside className="xl:sticky xl:top-6">
                <OrderSummary
                  items={cartItems}
                  subtotal={subtotal}
                  shipping={SHIPPING_COST}
                  discount={0}
                  total={total}
                  onSubmit={handlePayWithZarinpal}
                  isSubmitting={isRedirecting}
                  submitLabel="پرداخت با زرین‌پال"
                  backHref="/checkout/shipping"
                  backLabel="بازگشت"
                />
              </aside>
            </div>
          </div>
        </Container>
      </div>
    </div>
  );
}