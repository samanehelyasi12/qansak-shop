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
}: OrderSummaryProps) {
  return (
    <section className="space-y-4 rounded-xl border border-cream bg-white p-6">
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
          <dt className="text-cocoa/70">هزینه ارسال</dt>
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
      <button
        type="button"
        onClick={onSubmit}
        disabled={disabled || isSubmitting}
        className="w-full rounded-lg bg-caramel py-3 text-lg font-medium text-white transition-colors hover:bg-cocoa disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? "در حال پردازش..." : "ثبت سفارش و پرداخت"}
      </button>
    </section>
  );
}