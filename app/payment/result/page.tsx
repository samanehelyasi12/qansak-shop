import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import CheckoutStepper from "@/components/checkout/CheckoutStepper";
import type { PaymentResult } from "@/types/order";

export const metadata: Metadata = {
  title: "نتیجه پرداخت",
  description: "مشاهده نتیجه تراکنش پرداخت سفارش",
  robots: {
    index: false,
    follow: false,
  },
};

const mockPayments: Record<string, PaymentResult> = {
  "ORD-12345": {
    orderId: "ORD-12345",
    trackingCode: "TRK-987654321",
    amount: 850000,
    status: "success",
    date: "۱۴۰۳/۰۶/۱۵ ۱۴:۳۰",
    cardNumber: "۶۰۳۷ **** **** ۱۲۳۴",
  },
  "ORD-12346": {
    orderId: "ORD-12346",
    trackingCode: "TRK-123456789",
    amount: 440000,
    status: "success",
    date: "۱۴۰۳/۰۶/۱۸ ۱۰:۱۵",
    cardNumber: "۶۲۱۹ **** **** ۵۶۷۸",
  },
  "FAIL-001": {
    orderId: "ORD-99999",
    trackingCode: "TRK-000000000",
    amount: 100000,
    status: "failed",
    date: "۱۴۰۳/۰۶/۱۰ ۰۹:۰۰",
    cardNumber: "**** **** **** ****",
    error: "موجودی کارت کافی نیست",
  },
};

interface PaymentResultPageProps {
  searchParams: Promise<{ order?: string }>;
}

export default async function PaymentResultPage({ searchParams }: PaymentResultPageProps) {
  const { order } = await searchParams;

  if (!order) notFound();

  const payment = mockPayments[order];
  if (!payment) notFound();

  const isSuccess = payment.status === "success";

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#fbdde3]">
      {/* بک‌گراند دسکتاپ: باکس کیک سمت راست/ابتدای عکس، محتوا کنارش می‌شینه */}
      <div className="pointer-events-none absolute inset-0 -z-0 hidden lg:block">
        <Image
          src="/images/decor/payment-bg-desktop.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>

      {/* بک‌گراند موبایل: باکس کیک بالای عکس، محتوا زیرش می‌شینه */}
      <div className="pointer-events-none absolute inset-0 -z-0 lg:hidden">
        <Image
          src="/images/decor/payment-bg-mobile.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>

      {/* چیدمان: موبایل ستونی (اسپیسر جای باکس، بعد محتوا زیرش)
          دسکتاپ ردیفی (اسپیسر جای باکس، بعد محتوا کنارش) */}
      <div className="relative z-10 flex min-h-screen flex-col lg:flex-row-reverse">
        <div className="h-[38vh] shrink-0 sm:h-[34vh] lg:h-auto lg:w-[48%]" aria-hidden="true" />

        <div className="flex-1 py-6 sm:py-10 lg:flex lg:items-center lg:py-12">
          <Container>
            <div className="mx-auto w-full max-w-md lg:mx-0 lg:max-w-lg">
              <div className="mb-6 rounded-2xl border border-white/50 bg-white/40 px-3 py-4 shadow-sm backdrop-blur-xl sm:px-6">
                <CheckoutStepper currentStep={4} />
              </div>

              {/* کارت شیشه‌ای: بک‌گراند از پشتش کمی دیده می‌شود */}
              <div className="rounded-3xl border border-white/50 bg-white/40 p-6 text-center shadow-[0_16px_50px_rgba(80,40,30,0.10)] backdrop-blur-xl sm:p-8">
                <div className="mb-5">
                  {isSuccess ? (
                    <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-pistachio/15 text-pistachio text-3xl" role="img" aria-hidden="true">
                      ✓
                    </span>
                  ) : (
                    <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-berry/15 text-berry text-3xl" role="img" aria-hidden="true">
                      ✕
                    </span>
                  )}
                </div>

                <h1 className="mb-2 text-xl font-bold text-cocoa sm:text-2xl">
                  {isSuccess ? "پرداخت با موفقیت انجام شد" : "پرداخت ناموفق بود"}
                </h1>
                <p className="mb-6 text-sm text-cocoa/70">
                  {isSuccess
                    ? "سفارش شما ثبت شد و پیک قندک به‌زودی برای تحویل هماهنگ می‌کند."
                    : "متأسفانه تراکنش با خطا مواجه شد. لطفاً مجدداً تلاش کنید."}
                </p>

                <div className="mb-6 rounded-2xl border border-white/60 bg-white/50 p-4 text-right backdrop-blur-md sm:p-5">
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between lg:justify-end lg:gap-3">
                      <dt className="text-cocoa/60">شماره سفارش</dt>
                      <dd className="font-mono font-medium text-cocoa">{payment.orderId}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-cocoa/60">کد پیگیری</dt>
                      <dd className="font-mono font-medium text-caramel">{payment.trackingCode}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-cocoa/60">مبلغ</dt>
                      <dd className="font-bold text-cocoa">{payment.amount.toLocaleString("fa-IR")} تومان</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-cocoa/60">کارت پرداخت</dt>
                      <dd className="font-mono text-cocoa/60">{payment.cardNumber}</dd>
                    </div>
                    <div className="flex justify-between lg:justify-end lg:gap-3">
                      <dt className="text-cocoa/60">تاریخ و زمان</dt>
                      <dd className="text-cocoa/60">{payment.date}</dd>
                    </div>
                    {!isSuccess && payment.error && (
                      <div className="flex justify-between text-berry">
                        <dt className="text-cocoa/60">دلیل خطا</dt>
                        <dd>{payment.error}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                {/* دکمه‌ها کوچیک‌تر شدن، متن هم سایزشون کوچیک‌تره */}
                <div className="flex flex-col gap-2.5 sm:flex-row sm:justify-center">
                  {isSuccess && (
                    <Link href={`/order/${payment.orderId}`}>
                      <Button size="sm" className="cursor-pointer px-5 text-xs">
                        مشاهده سفارش
                      </Button>
                    </Link>
                  )}
                  {isSuccess ? (
                    <Link href="/">
                      <Button variant="secondary" size="sm" className="cursor-pointer px-5 text-xs">
                        بازگشت به خانه
                      </Button>
                    </Link>
                  ) : (
                    <Link href="/checkout/payment">
                      <Button variant="secondary" size="sm" className="cursor-pointer px-5 text-xs">
                        تلاش مجدد
                      </Button>
                    </Link>
                  )}
                </div>

                <p className="mt-5 text-xs leading-6 text-cocoa/50">
                  یک کپی از رسید برای شما پیامک می‌شود. کد پیگیری را برای مراجعه‌های بعدی حفظ کنید.
                </p>
              </div>
            </div>
          </Container>
        </div>
      </div>
    </div>
  );
}