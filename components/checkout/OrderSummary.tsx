import Link from "next/link";

interface OrderSummaryProps {
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    slug: string;
  }>;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  onSubmit: () => void;
  disabled?: boolean;
  isSubmitting?: boolean;
  /** متن دکمه اصلی؛ پیش‌فرض برای مرحله ثبت اطلاعات */
  submitLabel?: string;
  /** آدرس بازگشت به مرحله قبل؛ اگر ندید دکمه بازگشت نمایش داده نمی‌شود */
  backHref?: string;
  backLabel?: string;
}

export default function OrderSummary({
  items,
  subtotal,
  shipping,
  discount,
  total,
  onSubmit,
  disabled = false,
  isSubmitting = false,
  submitLabel = "ثبت سفارش و پرداخت",
  backHref,
  backLabel = "بازگشت",
}: OrderSummaryProps) {
  return (
    <section className="space-y-4 rounded-3xl border border-white/80 bg-white/95 p-5 shadow-[0_16px_50px_rgba(80,40,30,0.10)] backdrop-blur-md sm:p-6">
      <h2 className="text-xl font-bold text-caramel">خلاصه سفارش</h2>
      <div className="space-y-3 max-h-60 overflow-y-auto">
        {items.map((item, index) => (
          <div key={index} className="flex gap-4 border-b border-cream pb-3 last:border-0 last:pb-0">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-cocoa truncate">{item.name}</h3>
              <p className="text-sm text-cocoa/60">تعداد: {item.quantity}</p>
            </div>
            <span className="font-bold text-cocoa">
              {(item.price * item.quantity).toLocaleString("fa-IR")} تومان
            </span>
          </div>
        ))}
      </div>
      <dl className="border-t border-cream pt-4 space-y-3">
        <div className="flex justify-between">
          <dt className="text-cocoa/70">مجموع محصولات</dt>
          <dd className="font-medium text-cocoa">{subtotal.toLocaleString("fa-IR")} تومان</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-cocoa/70">هزینه پیک</dt>
          <dd className="font-medium text-cocoa">{shipping.toLocaleString("fa-IR")} تومان</dd>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-caramel">
            <dt className="text-cocoa/70">تخفیف</dt>
            <dd className="font-medium">-{discount.toLocaleString("fa-IR")} تومان</dd>
          </div>
        )}
        <div className="border-t border-cream pt-3 flex justify-between text-lg font-bold text-cocoa">
          <dt>مجموع قابل پرداخت</dt>
          <dd className="text-caramel">{total.toLocaleString("fa-IR")} تومان</dd>
        </div>
      </dl>

      {/* دکمه پرداخت/ادامه و بازگشت، کنار هم تا کاربر همینجا راه برگشت رو هم ببینه */}
      <div className="flex gap-3 pt-1">
        {backHref && (
          <Link
            href={backHref}
            className="flex shrink-0 items-center justify-center gap-1 rounded-lg border border-cream px-4 py-3 text-sm font-medium text-cocoa/70 transition-colors hover:border-caramel hover:text-caramel"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 19.5 6 12.75m0 0L12.75 6M6 12.75h13.5" />
            </svg>
            {backLabel}
          </Link>
        )}
        <button
          type="button"
          onClick={onSubmit}
          disabled={disabled || isSubmitting}
          className="flex-1 rounded-lg bg-caramel py-3 text-base font-medium text-white transition-colors hover:bg-cocoa disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "در حال پردازش..." : submitLabel}
        </button>
      </div>
    </section>
  );
}