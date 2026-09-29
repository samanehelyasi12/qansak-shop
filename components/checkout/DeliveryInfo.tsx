"use client";

import type { DeliveryMethod } from "@/lib/api/orders";

interface DeliveryInfoProps {
  deliveryMethod: DeliveryMethod;
  onDeliveryChange: (method: DeliveryMethod) => void;
}

const DELIVERY_OPTIONS: { value: DeliveryMethod; title: string; desc: string }[] = [
  {
    value: "standard",
    title: "ارسال عادی",
    desc: "تحویل توسط پیک قندک، طبق زمان‌بندی فروشگاه",
  },
  {
    value: "express",
    title: "ارسال سریع",
    desc: "اولویت آماده‌سازی و ارسال، برای سفارش‌های فوری",
  },
  {
    value: "pickup",
    title: "دریافت حضوری",
    desc: "تحویل از فروشگاه، بدون هزینه ارسال",
  },
];

export default function DeliveryInfo({
  deliveryMethod,
  onDeliveryChange,
}: DeliveryInfoProps) {
  return (
    <section className="space-y-6 rounded-3xl border border-white/80 bg-white/90 p-5 shadow-[0_16px_50px_rgba(80,40,30,0.08)] backdrop-blur-md sm:p-6">
      <h2 className="text-xl font-bold text-caramel">روش تحویل</h2>

      <div className="space-y-3">
        {DELIVERY_OPTIONS.map((option) => (
          <label
            key={option.value}
            className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition ${
              deliveryMethod === option.value
                ? "border-caramel bg-caramel/5"
                : "border-cream hover:border-caramel/50"
            }`}
          >
            <input
              type="radio"
              name="delivery"
              value={option.value}
              checked={deliveryMethod === option.value}
              onChange={() => onDeliveryChange(option.value)}
              className="h-4 w-4 text-caramel"
            />
            <div>
              <p className="font-medium text-cocoa">{option.title}</p>
              <p className="text-sm text-cocoa/60">{option.desc}</p>
            </div>
          </label>
        ))}
      </div>

      <div className="border-t border-cream pt-6">
        <h3 className="mb-4 font-bold text-cocoa">روش پرداخت</h3>

        {/*
          Only online payment exists. The gateway is the sole way to pay, so
          this is shown as the fixed method rather than a choice the backend
          would silently ignore.
        */}
        <div className="flex items-center gap-3 rounded-lg border border-caramel bg-caramel/5 p-4">
          <input
            type="radio"
            name="payment"
            value="online"
            checked
            readOnly
            aria-describedby="payment-method-note"
            className="h-4 w-4 text-caramel"
          />
          <div>
            <p className="font-medium text-cocoa">پرداخت آنلاین</p>
            <p className="text-sm text-cocoa/60">پرداخت امن از طریق درگاه بانکی</p>
          </div>
        </div>

        <p id="payment-method-note" className="mt-2 text-xs text-cocoa/50">
          پرداخت پس از ثبت سفارش و از طریق درگاه انجام می‌شود.
        </p>
      </div>
    </section>
  );
}