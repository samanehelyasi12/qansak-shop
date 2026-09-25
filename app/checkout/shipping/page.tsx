"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Container from "@/components/ui/Container";
import CheckoutStepper from "@/components/checkout/CheckoutStepper";
import CustomerForm from "@/components/checkout/CustomerForm";
import DeliveryInfo from "@/components/checkout/DeliveryInfo";
import OrderSummary from "@/components/checkout/OrderSummary";
import EmptyCart from "@/components/cart/EmptyCart";
import { useCart } from "@/lib/cart/store";
import { getCartTotals, toOrderSummaryItems } from "@/lib/cart/totals";
import { SHIPPING_COST } from "@/lib/checkout/config";

type CustomerData = {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
};

export default function ShippingPage() {
  const router = useRouter();
  const { items: cartItems } = useCart();

  const [customer, setCustomer] = useState<CustomerData>({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<"online" | "card" | "cash">("online");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const summaryItems = toOrderSummaryItems(cartItems);
  const { subtotal, discount, total } = getCartTotals(cartItems, SHIPPING_COST);

  const isCustomerValid =
    customer.firstName.trim() !== "" &&
    customer.lastName.trim() !== "" &&
    customer.phone.trim() !== "" &&
    customer.address.trim() !== "";

  const handleContinue = async () => {
    if (!isCustomerValid) return;
    setIsSubmitting(true);
    try {
      // فقط اطلاعات مشتری/تحویل موقتاً نگه داشته می‌شود.
      // مبلغ سفارش عمداً ذخیره نمی‌شود؛ منبع حقیقت، سبد و lib/cart/totals است.
      // TODO: بعد از اتصال جنگو، به‌جای sessionStorage یک سفارش پیش‌نویس
      // (مثلاً POST /api/orders/draft/) ساخته شود تا amount/orderId واقعی داشته باشیم.
      sessionStorage.setItem(
        "qandak_checkout_customer",
        JSON.stringify({ customer, paymentMethod })
      );
      router.push("/checkout/payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  // سبد خالی: هیچ سفارش نمایشی ساخته نمی‌شود
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
                <CustomerForm initialData={customer} onChange={setCustomer} />
                <DeliveryInfo selectedPayment={paymentMethod} onPaymentChange={setPaymentMethod} />
              </section>

              {/* خلاصه سفارش، با دکمه بازگشت کنار دکمه ادامه */}
              <aside className="xl:sticky xl:top-6">
                <OrderSummary
                  items={summaryItems}
                  subtotal={subtotal}
                  shipping={SHIPPING_COST}
                  discount={discount}
                  total={total}
                  onSubmit={handleContinue}
                  disabled={!isCustomerValid}
                  isSubmitting={isSubmitting}
                  submitLabel="ادامه به پرداخت ←"
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