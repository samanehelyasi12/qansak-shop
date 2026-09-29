/**
 * Shapes the account panel renders.
 *
 * These are the panel's own types, deliberately kept apart from the API types
 * in `lib/api`. The panel only knows how to draw what is described here, so
 * replacing placeholder records with backend calls later is a change of where
 * the values come from — not of anything the components do with them.
 */

export type AccountOrderStatus =
  | "confirmed"
  | "preparing"
  | "ready"
  | "delivered"
  | "cancelled";

export type AccountPaymentStatus = "paid" | "pending" | "failed" | "refunded";

export type AccountDeliveryMethod = "express" | "standard" | "pickup";

/**
 * Who is signed in.
 *
 * Only these fields come from the session. The ones marked nullable are facts
 * the session does not carry yet, and the panel hides whatever is missing
 * rather than filling it in with a number it made up.
 */
export interface AccountUser {
  id: number;
  firstName: string;
  lastName: string;
  /** Shown on the header button, e.g. "زهرا کریمی". */
  displayName: string;
  email: string | null;
  phone: string | null;
  /** ISO date the account was created. `null` until the backend provides it. */
  memberSince: string | null;
  /** The code this customer hands to friends. The server decides what it is worth. */
  referralCode: string | null;
  /** Loyalty points already earned. `null` until the backend provides it. */
  loyaltyPoints: number | null;
}

export interface AccountOrderItem {
  id: number;
  name: string;
  slug: string;
  image: string;
  quantity: number;
  unitPrice: number;
  total: number;
  /** The options chosen at the time, kept as they were, not re-read from the product. */
  options: { label: string; value: string }[];
}

export interface AccountOrder {
  code: string;
  trackingCode: string;
  /** ISO date the order was placed. */
  createdAt: string;
  status: AccountOrderStatus;
  paymentStatus: AccountPaymentStatus;
  deliveryMethod: AccountDeliveryMethod;
  recipient: string;
  phone: string;
  address: string;
  items: AccountOrderItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
}

/** An order that was paid for, and the paper trail that proves it. */
export interface AccountReceipt extends AccountOrder {
  receiptCode: string;
  /** ISO date the money was actually taken. */
  paidAt: string;
  /** The gateway's own reference, shown for support calls. */
  refId: string;
  paymentGateway: string;
}

export interface AccountAddress {
  id: string;
  title: string;
  recipient: string;
  phone: string;
  address: string;
  isDefault: boolean;
}

export interface AccountFavorite {
  id: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  inStock: boolean;
}
