"use client";

/**
 * The payment step.
 *
 * There is no fake payment here any more. The order already exists by the time
 * this page runs, and its real amount was decided by the server. This page only
 * asks the server to start a payment and then hands the customer over to the
 * gateway; it never declares that anything succeeded.
 */

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Container from "@/components/ui/Container";
import CheckoutStepper from "@/components/checkout/CheckoutStepper";
import OrderSummary from "@/components/checkout/OrderSummary";
import { ApiError } from "@/lib/api/client";
import { orderApi, type Order } from "@/lib/api/orders";
import { useCart } from "@/lib/cart/store";

function formatToman(value: number) {
  return value.toLocaleString("fa-IR");
}

function PaymentStep() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderCode = searchParams.get("order");

  const { clearCart } = useCart();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrder = useCallback(async () => {
    if (!orderCode) {
      setError("سفارشی برای پرداخت پیدا نشد.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const loaded = await orderApi.byCode(orderCode);
      setOrder(loaded);
      // The order now lives on the server, so the local cart has done its job.
      clearCart();
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "سفارش قابل نمایش نیست.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [orderCode, clearCart]);

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  async function handlePay() {
    if (!order || isRedirecting) return;

    setIsRedirecting(true);
    setError(null);

    try {
      const { payment_url } = await orderApi.startPayment(order.order_code);
      // A full navigation, not a router push: this leaves the app for the
      // gateway and the browser will come back to the callback.
      window.location.href = payment_url;
    } catch (caught) {
      setIsRedirecting(false);
      setError(
        caught instanceof ApiError
          ? caught.message
          : "اتصال به درگاه پرداخت ممکن نشد.",
      );
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-cocoa/60">در حال دریافت سفارش...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="mx-auto max-w-md px-6 text-center">
          <p role="alert" className="mb-6 text-berry">
            {error ?? "سفارشی برای پرداخت پیدا نشد."}
          </p>
          <button
            type="button"
            onClick={() => router.push("/cart")}
            className="rounded-xl bg-berry px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-caramel"
          >
            بازگشت به سبد
          </button>
        </div>
      </div>
    );
  }

  const summaryItems = order.items.map((item) => ({
    name: item.product_name,
    quantity: item.quantity,
    price: Number(item.price),
    slug: item.product_slug,
  }));

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

            <div className="mb-7 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="mb-1 text-sm font-medium text-caramel">
                  قندک | خرید شما
                </p>
                <h1 className="text-2xl font-bold tracking-tight text-cocoa sm:text-3xl">
                  پرداخت
                </h1>
              </div>
              <p className="text-sm text-cocoa/55">
                مبلغ نهایی از سرور محاسبه شده است:{" "}
                <span className="font-bold text-cocoa">
                  {formatToman(order.total)} تومان
                </span>
              </p>
            </div>

            {error && (
              <p
                role="alert"
                className="mb-5 rounded-2xl border border-berry/30 bg-berry/5 px-4 py-3 text-sm text-berry"
              >
                {error}
              </p>
            )}

            <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
              <section className="min-w-0 space-y-5">
                <div className="rounded-3xl border border-white/80 bg-white/90 p-5 shadow-[0_16px_50px_rgba(80,40,30,0.08)] backdrop-blur-md sm:p-6">
                  <h2 className="mb-3 text-xl font-bold text-caramel">
                    خلاصه سفارش
                  </h2>

                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-cocoa/60">شماره سفارش</dt>
                      <dd className="font-mono text-cocoa">{order.order_code}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-cocoa/60">تحویل‌گیرنده</dt>
                      <dd className="text-cocoa">
                        {order.first_name} {order.last_name}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-cocoa/60">نشانی</dt>
                      <dd className="max-w-[60%] text-left text-cocoa">
                        {order.address}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-cocoa/60">روش تحویل</dt>
                      <dd className="text-cocoa">
                        {order.delivery_method === "pickup"
                          ? "دریافت حضوری"
                          : order.delivery_method === "express"
                            ? "ارسال سریع"
                            : "ارسال عادی"}
                      </dd>
                    </div>
                  </dl>

                  <p className="mt-5 text-xs leading-6 text-cocoa/55">
                    مبلغ سفارش توسط سرور محاسبه و ثبت شده است. با کلیک روی
                    دکمهٔ پرداخت، به درگاه بانکی هدایت می‌شوید و پس از پرداخت
                    نتیجهٔ نهایی از سرور نمایش داده می‌شود.
                  </p>
                </div>
              </section>

              <aside className="xl:sticky xl:top-6">
                <OrderSummary
                  items={summaryItems}
                  subtotal={Number(order.subtotal)}
                  shipping={Number(order.shipping_cost)}
                  discount={Number(order.discount)}
                  total={Number(order.total)}
                  onSubmit={handlePay}
                  disabled={isRedirecting}
                  isSubmitting={isRedirecting}
                  submitLabel={
                    isRedirecting
                      ? "در حال اتصال به درگاه..."
                      : "پرداخت و پرداخت آنلاین ←"
                  }
                  backHref={`/order/${order.order_code}`}
                  backLabel="مشاهده سفارش"
                />
              </aside>
            </div>
          </div>
        </Container>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-cocoa/60">در حال بارگذاری...</p>
        </div>
      }
    >
      <PaymentStep />
    </Suspense>
  );
}
