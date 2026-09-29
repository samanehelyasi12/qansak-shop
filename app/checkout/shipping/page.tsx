"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Container from "@/components/ui/Container";
import CheckoutStepper from "@/components/checkout/CheckoutStepper";
import CustomerForm, { type CustomerFormData } from "@/components/checkout/CustomerForm";
import DeliveryInfo from "@/components/checkout/DeliveryInfo";
import OrderSummary from "@/components/checkout/OrderSummary";
import EmptyCart from "@/components/cart/EmptyCart";
import { useCart } from "@/lib/cart/store";
import { getCartTotals, toOrderSummaryItems } from "@/lib/cart/totals";
import { SHIPPING_COST } from "@/lib/checkout/config";
import { buildOrderItems, DEFAULT_DELIVERY_METHOD } from "@/lib/cart/orderPayload";
import { ApiError } from "@/lib/api/client";
import { customerApi } from "@/lib/api/customer";
import { orderApi, type DeliveryMethod } from "@/lib/api/orders";
import { useAuth } from "@/lib/api/useAuth";

export default function ShippingPage() {
  const router = useRouter();
  const { items: cartItems } = useCart();
  const { user, isLoading: isAuthLoading } = useAuth();

  const [customer, setCustomer] = useState<CustomerFormData>({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    email: "",
  });
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>(
    DEFAULT_DELIVERY_METHOD,
  );
  const [discountCode, setDiscountCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A signed-in customer should not retype what the shop already knows.
  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    void (async () => {
      try {
        const [profile, savedAddress] = await Promise.all([
          customerApi.profile(),
          customerApi.address(),
        ]);
        if (cancelled) return;

        setCustomer((current) => ({
          firstName: current.firstName || profile.first_name || user.first_name,
          lastName: current.lastName || profile.last_name || user.last_name,
          phone: current.phone || profile.phone_number || user.phone_number || "",
          address: current.address || savedAddress?.address || "",
          email: current.email || user.email || "",
        }));
      } catch {
        // Prefill is a convenience; an empty form is still usable.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  // Display-only estimate. The server recomputes every amount when it accepts
  // the order, and that response is what the payment step shows.
  const summaryItems = toOrderSummaryItems(cartItems);
  const { subtotal, discount, total } = getCartTotals(cartItems, SHIPPING_COST);

  const { items: orderItems, problems } = buildOrderItems(cartItems);

  const isCustomerValid =
    customer.address.trim() !== "" &&
    // A guest has to give contact details; a signed-in customer already has them.
    (user
      ? true
      : customer.firstName.trim() !== "" &&
        customer.lastName.trim() !== "" &&
        customer.phone.trim() !== "" &&
        (customer.email ?? "").trim() !== "");

  async function handleContinue() {
    if (!isCustomerValid || isSubmitting || problems.length > 0) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const common = {
        items: orderItems,
        delivery_method: deliveryMethod,
        ...(discountCode.trim() ? { discount_code: discountCode.trim() } : {}),
      };

      let orderCode: string;

      if (user) {
        // Save the typed address first: the order copies it, and a customer
        // with no stored address would otherwise be refused.
        await customerApi.saveAddress(customer.address.trim());
        const order = await orderApi.place(common);
        orderCode = order.order_code;
      } else {
        const order = await orderApi.placeGuest({
          ...common,
          first_name: customer.firstName.trim(),
          last_name: customer.lastName.trim(),
          email: (customer.email ?? "").trim(),
          phone_number: customer.phone.trim(),
          address: customer.address.trim(),
        });
        orderCode = order.order_code;
      }

      // Only the order code travels in the URL. No personal data is stored in
      // the browser between the steps.
      router.push(`/checkout/payment?order=${encodeURIComponent(orderCode)}`);
    } catch (caught) {
      setIsSubmitting(false);
      if (caught instanceof ApiError) {
        setError(caught.message);
      } else {
        setError("ثبت سفارش انجام نشد. لطفاً دوباره تلاش کنید.");
      }
    }
  }

  // سبد خالی
  if (cartItems.length === 0) {
    return <EmptyCart />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#fff9f7]">
      {/* بک‌گراند دسکتاپ — همون بک‌گراند صفحه سبد خرید */}
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

      {/* بک‌گراند موبایل — همون بک‌گراند صفحه سبد خرید */}
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
              <CheckoutStepper currentStep={2} />
            </div>

            <div className="mb-7 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="mb-1 text-sm font-medium text-caramel">قندک | خرید شما</p>
                <h1 className="text-2xl font-bold tracking-tight text-cocoa sm:text-3xl">
                  اطلاعات ارسال
                </h1>
              </div>
              <p className="text-sm text-cocoa/55">
                اطلاعات تحویل‌گیرنده را وارد کنید و به مرحله پرداخت بروید.
              </p>
            </div>

            <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
              {/* فرم‌ها */}
              <section className="min-w-0 space-y-5">
                <CustomerForm
                  initialData={customer}
                  onChange={setCustomer}
                  showEmail={!user && !isAuthLoading}
                />

                <DeliveryInfo
                  deliveryMethod={deliveryMethod}
                  onDeliveryChange={setDeliveryMethod}
                />

                {/*
                  The code is only an identifier. Whether it is valid, which
                  discount it is, and how much comes off are all decided by the
                  server when the order is placed.
                */}
                <div className="rounded-3xl border border-white/80 bg-white/90 p-5 shadow-[0_16px_50px_rgba(80,40,30,0.08)] backdrop-blur-md sm:p-6">
                  <label
                    htmlFor="discount-code"
                    className="mb-2 block text-sm font-medium text-cocoa"
                  >
                    کد تخفیف
                  </label>
                  <input
                    id="discount-code"
                    type="text"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    placeholder="اختیاری"
                    className="w-full rounded-lg border border-cream bg-white px-4 py-2 text-cocoa placeholder:text-cocoa/35 focus:border-caramel focus:outline-none focus:ring-2 focus:ring-caramel"
                  />
                </div>

                {problems.length > 0 && (
                  <ul
                    role="alert"
                    className="space-y-1 rounded-2xl border border-berry/30 bg-berry/5 px-4 py-3 text-sm text-berry"
                  >
                    {problems.map((problem) => (
                      <li key={problem.productId}>
                        {problem.productName}: {problem.message}
                      </li>
                    ))}
                  </ul>
                )}

                {error && (
                  <p
                    role="alert"
                    className="rounded-2xl border border-berry/30 bg-berry/5 px-4 py-3 text-sm text-berry"
                  >
                    {error}
                  </p>
                )}
              </section>

              {/* خلاصه سفارش، با دکمه بازگشت کنار دکمه ادامه */}
              <aside className="xl:sticky xl:top-6">
                <OrderSummary
                  items={summaryItems}
                  subtotal={subtotal}
                  shipping={deliveryMethod === "pickup" ? 0 : SHIPPING_COST}
                  discount={discount}
                  total={total}
                  onSubmit={handleContinue}
                  disabled={!isCustomerValid || problems.length > 0}
                  isSubmitting={isSubmitting}
                  submitLabel="ثبت سفارش و پرداخت ←"
                  backHref="/cart"
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