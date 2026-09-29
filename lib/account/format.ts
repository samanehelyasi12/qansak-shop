/**
 * Display helpers for the account panel: money, the Solar Hijri calendar, and
 * the wording for each status.
 *
 * The amount on screen is always one that arrived with the data. Nothing here
 * recalculates a price.
 */

import type {
  AccountDeliveryMethod,
  AccountOrderStatus,
  AccountPaymentStatus,
} from "./types";

const jalaliDate = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

const jalaliDateTime = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** The same calendar the rest of the shop writes dates in, not Gregorian. */
export function formatJalali(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "—" : jalaliDate.format(date);
}

export function formatJalaliDateTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "—" : jalaliDateTime.format(date);
}

export function formatToman(value: number): string {
  return `${value.toLocaleString("fa-IR")} تومان`;
}

export interface StatusMeta {
  label: string;
  /** A short sentence explaining to the customer what this status means. */
  description: string;
  chip: string;
  dot: string;
}

export const ORDER_STATUS_META: Record<AccountOrderStatus, StatusMeta> = {
  confirmed: {
    label: "تأیید شده",
    description: "سفارش شما ثبت شده و در صف بررسی قندک است.",
    chip: "bg-caramel/10 text-caramel",
    dot: "bg-caramel",
  },
  preparing: {
    label: "در حال تهیه",
    description: "آشپزخانه قندک مشغول آماده‌سازی سفارش شماست.",
    chip: "bg-qandek-peach/50 text-qandek-brown",
    dot: "bg-qandek-strawberry",
  },
  ready: {
    label: "آماده تحویل",
    description: "سفارش آماده است و به‌زودی به دست شما می‌رسد.",
    chip: "bg-pistachio/15 text-pistachio",
    dot: "bg-pistachio",
  },
  delivered: {
    label: "تحویل داده شده",
    description: "این سفارش تحویل داده شده است.",
    chip: "bg-pistachio/15 text-pistachio",
    dot: "bg-pistachio",
  },
  cancelled: {
    label: "لغو شده",
    description: "این سفارش لغو شده و مبلغی بابت آن کسر نمی‌شود.",
    chip: "bg-berry/10 text-berry",
    dot: "bg-berry",
  },
};

/** The order of a successful order's progress, used by the tracker. */
export const ORDER_PROGRESS: { status: AccountOrderStatus; label: string }[] = [
  { status: "confirmed", label: "تأیید شد" },
  { status: "preparing", label: "در حال تهیه" },
  { status: "ready", label: "آماده تحویل" },
  { status: "delivered", label: "تحویل شد" },
];

export const PAYMENT_STATUS_META: Record<
  AccountPaymentStatus,
  { label: string; chip: string }
> = {
  paid: { label: "پرداخت شده", chip: "bg-pistachio/15 text-pistachio" },
  pending: { label: "در انتظار پرداخت", chip: "bg-caramel/10 text-caramel" },
  failed: { label: "پرداخت ناموفق", chip: "bg-berry/10 text-berry" },
  refunded: { label: "مبلغ مسترد شده", chip: "bg-qandek-pink/60 text-qandek-brown" },
};

export const DELIVERY_METHOD_LABELS: Record<AccountDeliveryMethod, string> = {
  express: "پیک سریع (۳ ساعت)",
  standard: "پست پیشتاز (۱ تا ۲ روز)",
  pickup: "تحویل حضوری از شعبه",
};

/** The first letter of the first name, for the avatar. */
export function getInitial(name: string): string {
  return name.trim().charAt(0) || "ق";
}
