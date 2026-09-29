"use client";

/**
 * The dashboard: what the customer would look for first — how much they have
 * ordered, what is on its way, and where it is going.
 *
 * Every figure here is counted from the orders that were handed in, so the
 * numbers cannot disagree with the order list behind them.
 */

import Link from "next/link";
import { Copy, Gift, MapPin, Package, Sparkles, Wallet } from "lucide-react";

import {
  CompactOrderRow,
  DeliveryLine,
  OrderProgress,
  OrderStatusChip,
  PanelCard,
} from "@/components/account/ui";
import { formatToman } from "@/lib/account/format";
import type {
  AccountAddress,
  AccountOrder,
  AccountUser,
} from "@/lib/account/types";

/** Orders still on their way, newest first. */
function isLive(order: AccountOrder): boolean {
  return order.status !== "cancelled" && order.status !== "delivered";
}

interface AccountOverviewProps {
  user: AccountUser;
  orders: AccountOrder[];
  addresses: AccountAddress[];
  onOpenOrders: () => void;
  onOpenReceipts: () => void;
}

export default function AccountOverview({
  user,
  orders,
  addresses,
  onOpenOrders,
  onOpenReceipts,
}: AccountOverviewProps) {
  const liveOrders = orders.filter(isLive);
  const defaultAddress = addresses.find((address) => address.isDefault) ?? addresses[0];

  // Only orders money actually moved for count towards what was spent.
  const totalSpent = orders
    .filter((order) => order.paymentStatus === "paid")
    .reduce((sum, order) => sum + order.total, 0);

  const recentOrders = [...orders]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 4);

  const stats = [
    {
      label: "همه سفارش‌ها",
      value: orders.length.toLocaleString("fa-IR"),
      icon: Package,
    },
    {
      label: "سفارش‌های جاری",
      value: liveOrders.length.toLocaleString("fa-IR"),
      icon: Sparkles,
    },
    {
      label: "مجموع خرید",
      value: formatToman(totalSpent),
      icon: Wallet,
    },
  ];

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="rounded-3xl border border-white/80 bg-white/90 p-4 shadow-[0_16px_50px_rgba(80,40,30,0.06)] backdrop-blur-md sm:p-5"
            >
              <span
                aria-hidden="true"
                className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-qandek-cream text-caramel"
              >
                <Icon strokeWidth={1.7} className="h-5 w-5" />
              </span>

              <p className="text-xs text-cocoa/55">{stat.label}</p>
              <p className="mt-1 text-lg font-bold text-cocoa">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {liveOrders.length > 0 && (
        <PanelCard
          title="سفارش در جریان"
          description="سفارشی که هنوز به دست شما نرسیده است."
        >
          <div className="space-y-5">
            {liveOrders.slice(0, 2).map((order) => (
              <div key={order.code}>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-bold text-cocoa">
                      <span className="font-mono" dir="ltr">
                        {order.code}
                      </span>
                      <OrderStatusChip status={order.status} />
                    </p>
                    <p className="mt-1.5 text-xs text-cocoa/50">
                      کد پیگیری:{" "}
                      <span className="font-mono" dir="ltr">
                        {order.trackingCode}
                      </span>
                    </p>
                  </div>

                  <div className="text-left">
                    <p className="text-xs text-cocoa/50">
                      {order.items.length.toLocaleString("fa-IR")} کالا
                    </p>
                    <p className="mt-1 text-sm font-bold text-caramel">
                      {formatToman(order.total)}
                    </p>
                  </div>
                </div>

                <OrderProgress order={order} />

                <div className="mt-4 border-t border-cream/70 pt-4">
                  <DeliveryLine order={order} />
                </div>
              </div>
            ))}
          </div>
        </PanelCard>
      )}

      <PanelCard
        title="آخرین سفارش‌ها"
        action={
          <button
            type="button"
            onClick={onOpenOrders}
            className="cursor-pointer rounded-full border border-cocoa/10 px-3 py-1.5 text-xs font-medium text-cocoa/70 transition-colors duration-200 hover:bg-qandek-peach/40 hover:text-cocoa"
          >
            همه سفارش‌ها
          </button>
        }
      >
        {recentOrders.length > 0 ? (
          <ul>
            {recentOrders.map((order) => (
              <CompactOrderRow key={order.code} order={order} />
            ))}
          </ul>
        ) : (
          <EmptyOrders />
        )}
      </PanelCard>

      <div className="grid gap-5 md:grid-cols-2">
        <PanelCard title="آدرس تحویل پیش‌فرض">
          {defaultAddress ? (
            <div className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-qandek-cream text-caramel"
              >
                <MapPin strokeWidth={1.7} className="h-5 w-5" />
              </span>

              <div className="min-w-0">
                <p className="text-sm font-bold text-cocoa">{defaultAddress.title}</p>
                <p className="mt-1 text-xs leading-6 text-cocoa/60">
                  {defaultAddress.address}
                </p>
                <p className="mt-1 text-xs text-cocoa/50" dir="ltr">
                  {defaultAddress.phone}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-cocoa/60">
              هنوز آدرسی ثبت نکرده‌اید. برای سفارش‌های بعدی یک آدرس اضافه کنید.
            </p>
          )}

          <Link
            href="/account#addresses"
            className="mt-4 inline-block text-xs font-medium text-berry transition-colors hover:text-caramel"
          >
            مدیریت آدرس‌ها
          </Link>
        </PanelCard>

        <PanelCard title="کد معرفی شما">
          {user.referralCode ? (
            <>
              <div className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-qandek-cream text-caramel"
                >
                  <Gift strokeWidth={1.7} className="h-5 w-5" />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-cocoa">
                    کد: {user.referralCode}
                  </p>
                  <p className="mt-1 text-xs leading-6 text-cocoa/60">
                    این کد را به دوستانتان بدهید؛ وقتی آن‌ها از طریق شما ثبت‌نام
                    کنند، امتیاز به حساب شما اضافه می‌شود.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => void navigator.clipboard?.writeText(user.referralCode!)}
                className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-cocoa/10 px-3 py-2 text-xs font-medium text-cocoa/70 transition-colors duration-200 hover:bg-qandek-peach/40 hover:text-cocoa"
              >
                <Copy aria-hidden="true" strokeWidth={1.7} className="h-3.5 w-3.5" />
                کپی کد
              </button>
            </>
          ) : (
            <p className="text-sm leading-7 text-cocoa/60">
              کد معرفی شما هنوز صادر نشده است. به‌زودی در همین‌جا نمایش داده
              می‌شود.
            </p>
          )}

          <button
            type="button"
            onClick={onOpenReceipts}
            className="mt-3 mr-3 inline-block cursor-pointer text-xs font-medium text-berry transition-colors hover:text-caramel"
          >
            رسیدهای من
          </button>
        </PanelCard>
      </div>
    </>
  );
}

function EmptyOrders() {
  return (
    <div className="py-6 text-center">
      <p className="text-sm text-cocoa/60">هنوز سفارشی ثبت نکرده‌اید.</p>
      <Link
        href="/products"
        className="mt-3 inline-block rounded-xl bg-cocoa px-5 py-2.5 text-xs font-medium text-white transition-colors hover:bg-caramel"
      >
        شروع خرید
      </Link>
    </div>
  );
}
