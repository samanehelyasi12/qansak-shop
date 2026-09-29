/**
 * Order placement.
 *
 * The request carries only what the customer chose: which product, how many,
 * and which options. No price, no total, no shipping, no discount amount and
 * no customer id is sent, because the server decides all of those and would
 * ignore them anyway.
 *
 * The response is the authority: its amounts are what the order actually cost.
 */

import { apiClient } from "./client";
import type { ApiAmount } from "./types";

export type DeliveryMethod = "express" | "standard" | "pickup";
export type OrderStatus =
  | "confirmed"
  | "preparing"
  | "ready"
  | "delivered"
  | "cancelled";
export type PaymentStatus = "paid" | "pending" | "failed";

export interface OrderItemPayload {
  product: number;
  quantity: number;
  selected_options: Record<string, string>;
}

export interface PlaceOrderPayload {
  items: OrderItemPayload[];
  delivery_method: DeliveryMethod;
  discount_code?: string;
}

export interface GuestOrderPayload extends PlaceOrderPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  address: string;
}

export interface OrderItem {
  id: number;
  product_name: string;
  product_slug: string;
  quantity: number;
  price: number;
  total: number;
  selected_options: Record<string, string>;
  options_snapshot: Record<string, { option: string; value: string; price_delta: string }>;
}

export interface Order {
  order_code: string;
  tracking_code: string;
  datetime_created: string;
  status: OrderStatus;
  delivery_method: DeliveryMethod;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  address: string;
  items: OrderItem[];
  subtotal: number;
  shipping_cost: number;
  discount: number;
  total: number;
  customer: {
    first_name: string;
    last_name: string;
    phone: string;
    is_registered: boolean;
  };
}

export interface PaymentRequestResult {
  payment_url: string;
  order_code: string;
}

export interface PaymentResult {
  order_code: string;
  order_status: OrderStatus;
  amount: ApiAmount;
  payment_status: PaymentStatus;
  paid_at?: string | null;
}

function mapOrderItem(item: OrderItem): OrderItem {
  return { ...item, price: Number(item.price), total: Number(item.total) };
}

/** Server amounts arrive as decimal strings; the UI wants numbers. */
function mapOrder(order: Order): Order {
  return {
    ...order,
    subtotal: Number(order.subtotal),
    shipping_cost: Number(order.shipping_cost),
    discount: Number(order.discount),
    total: Number(order.total),
    items: order.items.map(mapOrderItem),
  };
}

export const orderApi = {
  /** Placed by a signed-in customer. The owner comes from the session. */
  place: async (payload: PlaceOrderPayload): Promise<Order> =>
    mapOrder(await apiClient.post<Order>("/api/orders/", payload)),

  /** Placed by a guest, who has no session and types their own details. */
  placeGuest: async (payload: GuestOrderPayload): Promise<Order> =>
    mapOrder(await apiClient.post<Order>("/api/guest-orders/", payload)),

  list: async (): Promise<Order[]> => {
    const raw = await apiClient.get<Order[]>("/api/orders/");
    return raw.map(mapOrder);
  },

  byCode: async (orderCode: string): Promise<Order> =>
    mapOrder(
      await apiClient.get<Order>(
        `/api/orders/${encodeURIComponent(orderCode)}/`,
      ),
    ),

  /** Starts a payment and returns where the customer has to go. */
  startPayment: async (orderCode: string): Promise<PaymentRequestResult> =>
    apiClient.post<PaymentRequestResult>("/api/payments/zarinpal/request/", {
      order_code: orderCode,
    }),

  /**
   * The real outcome of a payment. The only thing that may say whether money
   * moved; a query string cannot.
   */
  result: async (orderCode: string, email?: string): Promise<PaymentResult> => {
    const query = new URLSearchParams({ order_code: orderCode });
    if (email) query.set("email", email);
    return apiClient.get<PaymentResult>(`/api/payments/result/?${query}`);
  },
};
