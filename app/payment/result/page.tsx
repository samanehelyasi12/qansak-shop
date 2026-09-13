import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "نتیجه پرداخت | قندک",
  description: "مشاهده نتیجه تراکنش پرداخت سفارش",
};

const mockPayments: Record<string, any> = {
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

  if (!order) {
    notFound();
  }

  const payment = mockPayments[order];

  if (!payment) {
    notFound();
  }

  const isSuccess = payment.status === "success";

  return (
    <div className="py-16">
      <Container>
        <div className="max-w-md mx-auto text-center">
          <div className="mb-8">
            {isSuccess ? (
              <span className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-pistachio/10 text-pistachio text-4xl" role="img" aria-hidden="true">
                ✓
              </span>
            ) : (
              <span className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-berry/10 text-berry text-4xl" role="img" aria-hidden="true">
                ✕
              </span>
            )}
          </div>

          <h1 className="mb-3 text-2xl font-bold text-cocoa">
            {isSuccess ? "پرداخت با موفقیت انجام شد" : "پرداخت ناموفق بود"}
          </h1>
          <p className="mb-8 text-lg text-cocoa/70">
            {isSuccess
              ? "سفارش شما ثبت گردید و به زودی جهت تحویل آماده می‌شود."
              : "متأسفانه تراکنش با خطا مواجه شد. لطفاً مجدداً تلاش کنید."}
          </p>

          <div className="mb-8 rounded-xl border border-cream bg-white p-6 text-right">
            <dl className="space-y-4">
              <div className="flex justify-between">
                <dt className="text-cocoa/70">شماره سفارش</dt>
                <dd className="font-mono font-medium text-cocoa">{payment.orderId}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-cocoa/70">کد پیگیری</dt>
                <dd className="font-mono font-medium text-caramel">{payment.trackingCode}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-cocoa/70">مبلغ</dt>
                <dd className="font-bold text-cocoa">{payment.amount.toLocaleString("fa-IR")} تومان</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-cocoa/70">کارت پرداخت</dt>
                <dd className="font-mono text-cocoa/70">{payment.cardNumber}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-cocoa/70">تاریخ و زمان</dt>
                <dd className="text-cocoa/70">{payment.date}</dd>
              </div>
              {!isSuccess && payment.error && (
                <div className="flex justify-between text-berry">
                  <dt className="text-cocoa/70">دلیل خطا</dt>
                  <dd>{payment.error}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            {isSuccess && (
              <Link href={`/order/${payment.orderId}`}>
                <Button size="lg">مشاهده سفارش</Button>
              </Link>
            )}
            <Link href="/">
              <Button variant="secondary" size="lg">
                بازگشت به خانه
              </Button>
            </Link>
          </div>

          <p className="mt-6 text-sm text-cocoa/60">
            یک کپی از رسید برای شما ایمیل شده است. کد پیگیری را برای مراجعه‌های بعدی حفظ کنید.
          </p>
        </div>
      </Container>
    </div>
  );
}