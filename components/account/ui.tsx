/**
 * Small pieces shared across the account panel's sections.
 *
 * They exist so the panel says the same thing in the same colour everywhere: a
 * card is a card, a status reads the same in the order list and in the
 * dashboard, and the progress tracker is written once.
 */

import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { MapPin, Truck } from "lucide-react";

import {
  DELIVERY_METHOD_LABELS,
  ORDER_PROGRESS,
  ORDER_STATUS_META,
  PAYMENT_STATUS_META,
  formatJalali,
  formatToman,
} from "@/lib/account/format";
import type { AccountOrder, AccountOrderStatus } from "@/lib/account/types";

/** The frosted white card every section of the panel sits on. */
export function PanelCard({
  title,
  description,
  action,
  children,
  className = "",
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-3xl border border-white/80 bg-white/90 shadow-[0_16px_50px_rgba(80,40,30,0.08)] backdrop-blur-md ${className}`}
    >
      {(title || action) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cream/80 px-5 py-4 sm:px-6">
          <div>
            {title && (
              <h2 className="text-base font-bold text-cocoa sm:text-lg">{title}</h2>
            )}
            {description && (
              <p className="mt-1 text-xs text-cocoa/55">{description}</p>
            )}
          </div>
          {action}
        </div>
      )}

      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

export function OrderStatusChip({ status }: { status: AccountOrderStatus }) {
  const meta = ORDER_STATUS_META[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${meta.chip}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} aria-hidden="true" />
      {meta.label}
    </span>
  );
}

export function PaymentStatusChip({ status }: { status: AccountOrder["paymentStatus"] }) {
  const meta = PAYMENT_STATUS_META[status];

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${meta.chip}`}>
      {meta.label}
    </span>
  );
}

/** The delivery method and address, on one line. */
export function DeliveryLine({ order }: { order: AccountOrder }) {
  return (
    <p className="flex items-start gap-2 text-xs leading-6 text-cocoa/60">
      {order.deliveryMethod === "pickup" ? (
        <MapPin aria-hidden="true" strokeWidth={1.6} className="mt-1 h-3.5 w-3.5 shrink-0" />
      ) : (
        <Truck aria-hidden="true" strokeWidth={1.6} className="mt-1 h-3.5 w-3.5 shrink-0" />
      )}
      <span>
        {DELIVERY_METHOD_LABELS[order.deliveryMethod]}
        <span className="mx-1 text-cocoa/30">•</span>
        {order.address}
      </span>
    </p>
  );
}

/** The four steps a live order moves through, with the ones done filled in. */
export function OrderProgress({ order }: { order: AccountOrder }) {
  const isCancelled = order.status === "cancelled";
  const currentIndex = ORDER_PROGRESS.findIndex((step) => step.status === order.status);

  if (isCancelled) {
    return (
      <p className="rounded-2xl border border-berry/25 bg-berry/5 px-4 py-3 text-xs leading-6 text-berry">
        {ORDER_STATUS_META.cancelled.description}
      </p>
    );
  }

  return (
    <ol className="flex items-start gap-2 sm:gap-4">
      {ORDER_PROGRESS.map((step, index) => {
        const isDone = index <= currentIndex;

        return (
          <li key={step.status} className="relative flex-1 text-center">
            <div className="flex items-center">
              {index > 0 && (
                <span
                  aria-hidden="true"
                  className={`h-0.5 flex-1 rounded-full ${
                    index <= currentIndex ? "bg-pistachio/60" : "bg-cream"
                  }`}
                />
              )}

              <span
                aria-hidden="true"
                className={`mx-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-bold transition-colors ${
                  isDone
                    ? "border-pistachio bg-pistachio text-white"
                    : "border-cream bg-white text-cocoa/25"
                }`}
              >
                {isDone ? "✓" : index + 1}
              </span>

              {index < ORDER_PROGRESS.length - 1 && (
                <span
                  aria-hidden="true"
                  className={`h-0.5 flex-1 rounded-full ${
                    index < currentIndex ? "bg-pistachio/60" : "bg-cream"
                  }`}
                />
              )}
            </div>

            <span
              className={`mt-2 block text-[11px] leading-5 sm:text-xs ${
                isDone ? "font-medium text-cocoa" : "text-cocoa/40"
              }`}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** The item rows of an order, plus the money it added up to. */
export function OrderItems({ order }: { order: AccountOrder }) {
  return (
    <div>
      <ul className="divide-y divide-cream/80">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <Link
              href={`/products/${item.slug}`}
              className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-[#fff3ee]"
            >
              <Image
                src={item.image}
                alt={item.name}
                fill
                sizes="56px"
                className="object-contain p-1.5"
              />
            </Link>

            <div className="min-w-0 flex-1">
              <Link
                href={`/products/${item.slug}`}
                className="block truncate text-sm font-medium text-cocoa transition-colors hover:text-caramel"
              >
                {item.name}
              </Link>

              {item.options.length > 0 && (
                <p className="mt-1 truncate text-[11px] text-cocoa/50">
                  {item.options.map((option) => `${option.label}: ${option.value}`).join(" • ")}
                </p>
              )}

              <p className="mt-1 text-[11px] text-cocoa/50">
                {item.quantity.toLocaleString("fa-IR")} عدد × {formatToman(item.unitPrice)}
              </p>
            </div>

            <span className="shrink-0 text-sm font-bold text-cocoa">
              {formatToman(item.total)}
            </span>
          </li>
        ))}
      </ul>

      <dl className="mt-4 space-y-2 border-t border-cream/80 pt-4 text-xs">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-cocoa/55">جمع محصولات</dt>
          <dd className="font-medium text-cocoa">{formatToman(order.subtotal)}</dd>
        </div>

        <div className="flex items-center justify-between gap-4">
          <dt className="text-cocoa/55">هزینه ارسال</dt>
          <dd className="font-medium text-cocoa">
            {order.shipping === 0 ? "رایگان" : formatToman(order.shipping)}
          </dd>
        </div>

        {order.discount > 0 && (
          <div className="flex items-center justify-between gap-4">
            <dt className="text-cocoa/55">تخفیف</dt>
            <dd className="font-medium text-berry">−{formatToman(order.discount)}</dd>
          </div>
        )}

        <div className="flex items-center justify-between gap-4 border-t border-cream/80 pt-3 text-sm">
          <dt className="font-bold text-cocoa">مبلغ نهایی</dt>
          <dd className="font-bold text-caramel">{formatToman(order.total)}</dd>
        </div>
      </dl>
    </div>
  );
}

/** A row in the dashboard's "recent orders" strip. It only reports; it does not open. */
export function CompactOrderRow({ order }: { order: AccountOrder }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 border-b border-cream/70 py-3 last:border-0 last:pb-0 first:pt-0">
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-cocoa">
          <span className="font-mono" dir="ltr">
            {order.code}
          </span>
          <OrderStatusChip status={order.status} />
        </p>
        <p className="mt-1 text-[11px] text-cocoa/50">
          {formatJalali(order.createdAt)}
          <span className="mx-1.5 text-cocoa/30">•</span>
          {order.items.length.toLocaleString("fa-IR")} کالا
        </p>
      </div>

      <span className="text-sm font-bold text-cocoa">{formatToman(order.total)}</span>
    </li>
  );
}
