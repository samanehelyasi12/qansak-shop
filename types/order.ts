export type OrderStatus =
  | "confirmed"
  | "preparing"
  | "ready"
  | "delivered"
  | "cancelled";

export type DeliveryMethod = "express" | "standard" | "pickup";

export type PaymentMethod = "online" | "card" | "cash";

export type PaymentStatus = "paid" | "pending" | "failed";

export type PaymentResultStatus = "success" | "failed";

export interface OrderCustomer {
  firstName: string;
  lastName: string;
  phone: string;
}

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  slug: string;
}

export interface Order {
  id: string;
  date: string;
  status: OrderStatus;
  statusLabel: string;
  statusColor: string;
  customer: OrderCustomer;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  delivery: {
    method: DeliveryMethod;
    address: string;
  };
  payment: {
    method: PaymentMethod;
    status: PaymentStatus;
  };
}

export interface PaymentResult {
  orderId: string;
  trackingCode: string;
  amount: number;
  status: PaymentResultStatus;
  date: string;
  cardNumber: string;
  error?: string;
}
