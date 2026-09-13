"use client";

import { useState } from "react";
import DeliveryOption from "@/components/cart/DeliveryOption";

interface DeliveryInfoProps {
  selectedMethod: "express" | "standard" | "pickup";
  onDeliveryChange: (method: "express" | "standard" | "pickup") => void;
  selectedPayment: "online" | "card" | "cash";
  onPaymentChange: (method: "online" | "card" | "cash") => void;
}

export default function DeliveryInfo({
  selectedMethod,
  onDeliveryChange,
  selectedPayment,
  onPaymentChange,
}: DeliveryInfoProps) {
  return (
    <section className="space-y-6 rounded-xl border border-cream bg-white p-6">
      <h2 className="text-xl font-bold text-caramel">روش تحویل</h2>
      <DeliveryOption selectedMethod={selectedMethod} onChange={onDeliveryChange} />

      <div className="border-t border-cream pt-6">
        <h3 className="mb-4 font-bold text-cocoa">روش پرداخت</h3>
        <div className="space-y-3">
          {[
            { value: "online" as const, title: "پرداخت آنلاین", desc: "کارت به کارت، درگاه بانکی، وش کین" },
            { value: "card" as const, title: "پرداخت در محل (کارت)", desc: "فقط برای تحویل حضوری و پیک" },
            { value: "cash" as const, title: "پرداخت نقدی در محل", desc: "فقط برای تحویل حضوری" },
          ].map((option) => (
            <label
              key={option.value}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition ${
                selectedPayment === option.value
                  ? "border-caramel bg-caramel/5"
                  : "border-cream hover:border-caramel/50"
              }`}
            >
              <input
                type="radio"
                name="payment"
                value={option.value}
                checked={selectedPayment === option.value}
                onChange={() => onPaymentChange(option.value)}
                className="h-4 w-4 text-caramel"
              />
              <div>
                <p className="font-medium text-cocoa">{option.title}</p>
                <p className="text-sm text-cocoa/60">{option.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>
    </section>
  );
}