"use client";

/**
 * The customer's orders, newest first, filterable by where they are.
 *
 * A row opens in place: progress, what was ordered, where it goes, and a way
 * to the receipt. Nothing is fetched again to open a row — the order is already
 * in hand, and the amounts shown are the ones the order came with.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, Receipt } from "lucide-react";

import {
  DeliveryLine,
  OrderItems,
  OrderProgress,
  OrderStatusChip,
  PanelCard,
  PaymentStatusChip,
} from "@/components/account/ui";
import { ORDER_STATUS_META, formatJalali, formatToman } from "@/lib/account/format";
import type { AccountOrder } from "@/lib/account/types";

type FilterId = "all" | "live" | "delivered" | "cancelled";

const filters: { id: FilterId; label: string }[] = [
  { id: "all", label: "همه" },
  { id: "live", label: "در جریان" },
  { id: "delivered", label: "تحویل شده" },
  { id: "cancelled", label: "لغو شده" },
];

function matches(order: AccountOrder, filter: FilterId): boolean {
  switch (filter) {
    case "all":
      return true;
    case "live":
      return order.status !== "cancelled" && order.status !== "delivered";
    case "delivered":
      return order.status === "delivered";
    case "cancelled":
      return order.status === "cancelled";
  }
}

export default function AccountOrders({ orders }: { orders: AccountOrder[] }) {
  const [filter, setFilter] = useState<FilterId>("all");
  const [openCode, setOpenCode] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [orders],
  );

  const visible = useMemo(
    () => sorted.filter((order) => matches(order, filter)),
    [sorted, filter],
  );

  return (
    <PanelCard
      title="سفارش‌های من"
      description={`${orders.length.toLocaleString("fa-IR")} سفارش ثبت‌شده در حساب شما`}
    >
      {/* فیلتر وضعیت */}
      <div
        role="group"
        aria-label="فیلتر وضعیت سفارش"
        className="mb-5 flex flex-wrap gap-2"
      >
        {filters.map((item) => {
          const count = sorted.filter((order) => matches(order, item.id)).length;
          const isActive = item.id === filter;

          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => setFilter(item.id)}
              className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors duration-200 ${
                isActive
                  ? "border-cocoa bg-cocoa text-white"
                  : "border-cocoa/10 bg-white text-cocoa/65 hover:bg-qandek-peach/40 hover:text-cocoa"
              }`}
            >
              {item.label}
              <span className="mr-1.5 opacity-60">
                {count.toLocaleString("fa-IR")}
              </span>
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-sm text-cocoa/60">
            سفارشی در این دسته ندارید.
          </p>
          <Link
            href="/products"
            className="mt-4 inline-block rounded-xl bg-cocoa px-5 py-2.5 text-xs font-medium text-white transition-colors hover:bg-caramel"
          >
            مشاهده فروشگاه
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((order) => {
            const isOpen = openCode === order.code;

            return (
              <li
                key={order.code}
                className="overflow-hidden rounded-2xl border border-cream/80 bg-white/70"
              >
                <button
                  type="button"
                  onClick={() => setOpenCode(isOpen ? null : order.code)}
                  aria-expanded={isOpen}
                  className="flex w-full cursor-pointer flex-wrap items-center justify-between gap-3 px-4 py-4 text-right transition-colors duration-200 hover:bg-qandek-cream/40 sm:px-5"
                >
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-bold text-cocoa" dir="ltr">
                        {order.code}
                      </span>
                      <OrderStatusChip status={order.status} />
                      <PaymentStatusChip status={order.paymentStatus} />
                    </p>

                    <p className="mt-2 text-xs text-cocoa/55">
                      {formatJalali(order.createdAt)}
                      <span className="mx-1.5 text-cocoa/30">•</span>
                      {order.items.length.toLocaleString("fa-IR")} کالا
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-cocoa">
                      {formatToman(order.total)}
                    </span>

                    <span
                      aria-hidden="true"
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-cocoa/40 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    >
                      <ChevronDown strokeWidth={2} className="h-4 w-4" />
                    </span>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-cream/80 px-4 py-5 sm:px-5">
                    <p className="mb-4 text-xs leading-6 text-cocoa/60">
                      {ORDER_STATUS_META[order.status].description}
                    </p>

                    <div className="mb-5">
                      <OrderProgress order={order} />
                    </div>

                    <OrderItems order={order} />

                    <div className="mt-5 border-t border-cream/80 pt-4">
                      <DeliveryLine order={order} />
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {order.paymentStatus === "paid" && (
                        <Link
                          href={`/account#receipts`}
                          className="inline-flex items-center gap-2 rounded-xl border border-cocoa/10 px-4 py-2.5 text-xs font-medium text-cocoa/70 transition-colors duration-200 hover:bg-qandek-peach/40 hover:text-cocoa"
                        >
                          <Receipt aria-hidden="true" strokeWidth={1.7} className="h-4 w-4" />
                          مشاهده رسید
                        </Link>
                      )}

                      <Link
                        href={`/order/${order.code}`}
                        className="inline-flex items-center gap-2 rounded-xl bg-cocoa px-4 py-2.5 text-xs font-medium text-white transition-colors duration-200 hover:bg-caramel"
                      >
                        جزئیات سفارش
                      </Link>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </PanelCard>
  );
}
