"use client";

interface DeliveryInfoProps {
  selectedPayment: "online" | "card" | "cash";
  onPaymentChange: (method: "online" | "card" | "cash") => void;
}

export default function DeliveryInfo({ selectedPayment, onPaymentChange }: DeliveryInfoProps) {
  return (
    <section className="space-y-6 rounded-3xl border border-white/80 bg-white/90 p-5 shadow-[0_16px_50px_rgba(80,40,30,0.08)] backdrop-blur-md sm:p-6">
      <h2 className="text-xl font-bold text-caramel">روش تحویل</h2>

      <div className="flex items-center gap-3 rounded-lg border border-caramel bg-caramel/5 p-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-caramel text-white">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.25h-6c-.621 0-1.125.504-1.125 1.125v8.25c0 .621.504 1.125 1.125 1.125h1.5" />
          </svg>
        </span>
        <div>
          <p className="font-medium text-cocoa">پیک درون‌شهری</p>
          <p className="text-sm text-cocoa/60">تحویل توسط پیک قندک، فقط داخل محدوده شهر</p>
        </div>
      </div>

      <div className="border-t border-cream pt-6">
        <h3 className="mb-4 font-bold text-cocoa">روش پرداخت</h3>
        <div className="space-y-3">
          {[
            { value: "online" as const, title: "پرداخت آنلاین", desc: "کارت به کارت، درگاه بانکی، ولت" },
            { value: "card" as const, title: "کارت‌خوان در محل", desc: "پرداخت با کارت هنگام تحویل پیک" },
            { value: "cash" as const, title: "پرداخت نقدی در محل", desc: "پرداخت نقدی هنگام تحویل پیک" },
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