import { getLineTotal } from "@/lib/pricing";
import type { CartItem } from "./types";

export interface OrderSummaryLine {
  name: string;
  quantity: number;
  /** قیمت واحد مؤثر (شامل priceDelta گزینه‌های انتخاب‌شده) */
  price: number;
  slug: string;
}

export interface CartTotals {
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
}

/** مجموع قیمت محصولات سبد، با همان قانون قیمتِ lib/pricing.ts */
export function getCartSubtotal(items: CartItem[]): number {
  return items.reduce(
    (sum, item) =>
      sum + getLineTotal(item.product, item.selectedOptions, item.quantity),
    0,
  );
}

/**
 * تنها محاسبه‌گر مجموع‌های سبد. سبد خرید، مرحله ارسال و مرحله پرداخت
 * همگی از همین تابع استفاده می‌کنند تا مبالغ بین مراحل یکی باشد.
 */
export function getCartTotals(
  items: CartItem[],
  shipping: number,
  discount: number = 0,
): CartTotals {
  const subtotal = getCartSubtotal(items);

  return {
    subtotal,
    shipping,
    discount,
    total: subtotal + shipping - discount,
  };
}

/** تبدیل آیتم‌های سبد به ساختار مورد انتظار OrderSummary (بدون تغییر در آن کامپوننت) */
export function toOrderSummaryItems(items: CartItem[]): OrderSummaryLine[] {
  return items.map((item) => ({
    name: item.product.name,
    quantity: item.quantity,
    price: item.unitPrice,
    slug: item.product.slug,
  }));
}
