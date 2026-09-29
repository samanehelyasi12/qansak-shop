/**
 * Turning a cart into an order request.
 *
 * The cart is a UI state that holds a whole `Product` and a computed unit
 * price, because the screen needs to draw a total immediately. None of that is
 * sent. What leaves the browser is the smallest thing the server can act on:
 * the product id, a quantity, and which options were chosen.
 *
 * Everything about money is re-resolved on the server, so editing the cart in
 * devtools changes nothing that is charged.
 */

import type { CartItem } from "./types";
import type {
  DeliveryMethod,
  OrderItemPayload,
} from "@/lib/api/orders";

/** Backend ids are integers; the cart keeps them as strings for React keys. */
function toProductId(id: string): number {
  const parsed = Number(id);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}

export interface CartProblem {
  productId: string;
  productName: string;
  message: string;
}

/**
 * The request body for placing this order.
 *
 * Returns the problems it found alongside the items, so the checkout screen can
 * tell the customer what to fix instead of failing at the API.
 */
export function buildOrderItems(
  items: CartItem[],
): { items: OrderItemPayload[]; problems: CartProblem[] } {
  const problems: CartProblem[] = [];
  const payload: OrderItemPayload[] = [];

  for (const item of items) {
    const productId = toProductId(item.product.id);

    if (productId === 0) {
      problems.push({
        productId: item.product.id,
        productName: item.product.name,
        message: "این محصول دیگر در دسترس نیست.",
      });
      continue;
    }

    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      problems.push({
        productId: item.product.id,
        productName: item.product.name,
        message: "تعداد انتخاب‌شده معتبر نیست.",
      });
      continue;
    }

    // A product can disappear from the catalogue between adding it and
    // checking out. The cart is a snapshot, so warn before the server refuses.
    if (!item.product.inStock) {
      problems.push({
        productId: item.product.id,
        productName: item.product.name,
        message: "ناموجود شده است.",
      });
      continue;
    }

    // An option that no longer exists would be rejected by the server; catch it
    // here so the customer sees it before pressing the button.
    const known = new Set(
      (item.product.options ?? []).map((option) => option.slug),
    );
    const selected = item.selectedOptions ?? {};
    const staleOption = Object.keys(selected).find(
      (slug) => !known.has(slug),
    );
    if (staleOption) {
      problems.push({
        productId: item.product.id,
        productName: item.product.name,
        message: "یکی از گزینه‌های انتخاب‌شده دیگر موجود نیست.",
      });
      continue;
    }

    payload.push({
      product: productId,
      quantity: item.quantity,
      // Slugs, not ids: the slugs are what the server matches against.
      selected_options: { ...selected },
    });
  }

  return { items: payload, problems };
}

export const DEFAULT_DELIVERY_METHOD: DeliveryMethod = "standard";

export const DELIVERY_METHOD_LABELS: Record<DeliveryMethod, string> = {
  express: "ارسال سریع",
  standard: "ارسال عادی",
  pickup: "دریافت حضوری",
};
