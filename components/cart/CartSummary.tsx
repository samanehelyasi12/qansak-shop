interface CartSummaryProps {
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  itemCount: number;
  onProceedToCheckout: () => void;
  onContinueShopping: () => void;
}

export default function CartSummary({
  subtotal,
  shipping,
  discount,
  total,
  itemCount,
  onProceedToCheckout,
  onContinueShopping,
}: CartSummaryProps) {
  return (
    <aside className="sticky top-24 space-y-4 rounded-xl border border-cream bg-white p-6">
      <h2 className="border-b border-cream pb-4 font-bold text-cocoa">خلاصه سفارش</h2>
      <dl className="space-y-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-cocoa/70">مجموع محصولات ({itemCount})</dt>
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
      </dl>
      <div className="border-t border-cream pt-4">
        <div className="flex justify-between text-lg font-bold text-cocoa">
          <dt>مجموع قابل پرداخت</dt>
          <dd className="text-caramel">{total.toLocaleString("fa-IR")} تومان</dd>
        </div>
      </div>
      <button
        type="button"
        onClick={onProceedToCheckout}
        className="w-full rounded-lg bg-caramel py-3 text-lg font-medium text-white transition-colors hover:bg-cocoa"
      >
        ادامه به تسویه حساب
      </button>
      <button
        type="button"
        onClick={onContinueShopping}
        className="w-full rounded-lg border border-caramel bg-cream py-3 text-lg font-medium text-cocoa transition-colors hover:bg-caramel/10"
      >
        ادامه خرید
      </button>
    </aside>
  );
}