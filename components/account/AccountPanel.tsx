"use client";

/**
 * The customer panel.
 *
 * The whole thing is one client component because the sections share three
 * things: who is signed in, which section is open, and the list of orders the
 * receipt section is built from. The URL hash names the open section, so a
 * section can be linked to and the back button walks back through them.
 *
 * Nothing here decides anything about the customer — the session store does,
 * and the backend does once it is connected.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart,
  LayoutDashboard,
  LogOut,
  MapPin,
  Package,
  Receipt,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import Container from "@/components/ui/Container";
import AccountOverview from "@/components/account/AccountOverview";
import AccountOrders from "@/components/account/AccountOrders";
import AccountReceipts from "@/components/account/AccountReceipts";
import AccountAddresses from "@/components/account/AccountAddresses";
import AccountFavorites from "@/components/account/AccountFavorites";
import AccountProfile from "@/components/account/AccountProfile";
import AccountSecurity from "@/components/account/AccountSecurity";
import { PanelCard } from "@/components/account/ui";

import { accountSession } from "@/lib/account/session";
import { useAccountSession } from "@/lib/account/useAccountSession";
import {
  ACCOUNT_RECORDS_ARE_PLACEHOLDER,
  MOCK_ADDRESSES,
  MOCK_FAVORITES,
  MOCK_ORDERS,
  MOCK_RECEIPTS,
} from "@/lib/account/mock";
import { formatJalali, getInitial } from "@/lib/account/format";

const TABS = [
  { id: "overview", label: "داشبورد", icon: LayoutDashboard },
  { id: "orders", label: "سفارش‌های من", icon: Package },
  { id: "receipts", label: "رسیدهای من", icon: Receipt },
  { id: "addresses", label: "آدرس‌های من", icon: MapPin },
  { id: "favorites", label: "علاقه‌مندی‌ها", icon: Heart },
  { id: "profile", label: "اطلاعات حساب", icon: UserRound },
  { id: "security", label: "امنیت و رمز عبور", icon: ShieldCheck },
] as const;

type TabId = (typeof TABS)[number]["id"];

function isTabId(value: string): value is TabId {
  return TABS.some((tab) => tab.id === value);
}

function readHash(): TabId {
  if (typeof window === "undefined") return "overview";
  const value = window.location.hash.replace(/^#/, "");
  return isTabId(value) ? value : "overview";
}

export default function AccountPanel() {
  const router = useRouter();
  const { status, user, isPreview } = useAccountSession();

  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const tabsRef = useRef<HTMLUListElement>(null);

  // The open section is named by the URL hash, and the server is never told
  // what the hash is. So the first render is the dashboard on both sides —
  // which is what keeps the two from disagreeing — and the hash is adopted
  // straight after, here. A link like /account#receipts therefore lands on the
  // receipts, and the back button walks back through the sections.
  useEffect(() => {
    function handleHashChange() {
      setActiveTab(readHash());
    }

    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const goToTab = useCallback((tab: TabId) => {
    setActiveTab(tab);
    // replaceState rather than push: walking the back button out of the panel
    // section by section is not something anybody needs.
    window.history.replaceState(null, "", `#${tab}`);
  }, []);

  // On a narrow screen the sections are a strip that scrolls sideways, so the
  // section just opened has to be brought into view. `nearest` keeps the page
  // itself from jumping as a side effect.
  useEffect(() => {
    if (!tabsRef.current) return;
    const current = tabsRef.current.querySelector<HTMLElement>('[aria-current="true"]');
    current?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [activeTab]);

  function handleSignOut() {
    void accountSession.signOut();
    router.push("/");
    router.refresh();
  }

  if (status !== "authenticated" || !user) {
    return (
      <AccountBackground>
        <Container>
          <div className="mx-auto max-w-xl py-10 text-center">
            <PanelCard>
              <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-qandek-pink/40 text-cocoa/60">
                <UserRound aria-hidden="true" strokeWidth={1.5} className="h-7 w-7" />
              </span>

              <h1 className="text-xl font-bold text-cocoa sm:text-2xl">
                برای دیدن پنل کاربری وارد شوید
              </h1>

              <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-cocoa/60">
                سفارش‌ها، رسیدها و آدرس‌های شما بعد از ورود، همین‌جا در دسترس
                است.
              </p>

              <Link
                href="/login?next=/account"
                className="mt-6 inline-flex h-12 items-center justify-center rounded-2xl bg-berry px-8 text-sm font-bold text-white shadow-lg shadow-berry/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
              >
                ورود به حساب
              </Link>

              {/*
                A way to look at the panel before the records are connected.
                It only ever shows the placeholder customer, and it says so.
              */}
              <div className="mt-8 border-t border-cream/70 pt-5">
                <button
                  type="button"
                  onClick={() => accountSession.restorePreview()}
                  className="cursor-pointer text-xs font-medium text-cocoa/50 underline-offset-4 transition-colors hover:text-caramel hover:underline"
                >
                  پیش‌نمایش پنل با داده نمایشی
                </button>
              </div>
            </PanelCard>
          </div>
        </Container>
      </AccountBackground>
    );
  }

  return (
    <AccountBackground>
      <Container>
        <div className="mx-auto max-w-2xl xl:max-w-7xl">
          {/* سربرگ پنل: اسم کاربر، تاریخ عضویت و امتیاز */}
          <header className="mb-6 overflow-hidden rounded-3xl border border-white/80 bg-white/90 shadow-[0_16px_50px_rgba(80,40,30,0.08)] backdrop-blur-md">
            <div className="flex flex-wrap items-center gap-4 p-5 sm:gap-5 sm:p-7">
              <span
                aria-hidden="true"
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-cocoa text-2xl font-bold text-white shadow-md sm:h-20 sm:w-20 sm:text-3xl"
              >
                {getInitial(user.displayName)}
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-caramel">پنل کاربری قندک</p>
                <h1 className="mt-1 truncate text-xl font-bold tracking-tight text-cocoa sm:text-2xl">
                  {user.displayName}
                </h1>

                {/* Only what the session actually carries is written down. */}
                {(user.memberSince || user.phone || user.email) && (
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-cocoa/55">
                    {user.memberSince && <span>عضو از {formatJalali(user.memberSince)}</span>}
                    {user.memberSince && (user.phone || user.email) && (
                      <span className="text-cocoa/30">•</span>
                    )}
                    {(user.phone || user.email) && (
                      <span dir="ltr">{user.phone ?? user.email}</span>
                    )}
                  </p>
                )}
              </div>

              {/* The counts are only true while the records are the
                  placeholders; once they come from the backend these two
                  tiles are replaced by the real figures. */}
              {ACCOUNT_RECORDS_ARE_PLACEHOLDER && (
                <div className="flex gap-2 sm:gap-3">
                  <div className="rounded-2xl border border-qandek-pink/50 bg-qandek-cream/60 px-4 py-3 text-center">
                    <p className="text-[11px] text-cocoa/55">امتیاز قندک</p>
                    <p className="mt-0.5 text-base font-bold text-caramel">
                      {(user.loyaltyPoints ?? 0).toLocaleString("fa-IR")}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-qandek-pink/50 bg-qandek-cream/60 px-4 py-3 text-center">
                    <p className="text-[11px] text-cocoa/55">سفارش‌ها</p>
                    <p className="mt-0.5 text-base font-bold text-caramel">
                      {MOCK_ORDERS.length.toLocaleString("fa-IR")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </header>

          {(isPreview || ACCOUNT_RECORDS_ARE_PLACEHOLDER) && (
            <p className="mb-6 rounded-2xl border border-caramel/30 bg-caramel/10 px-4 py-3 text-xs leading-6 text-cocoa/70">
              {isPreview
                ? "کاربر نمایشی است و سفارش‌ها و رسیدها داده نمایشی‌اند."
                : "سفارش‌ها، رسیدها و آدرس‌ها فعلاً داده نمایشی‌اند و بعد از تأیید شما به بک‌اند وصل می‌شوند."}
            </p>
          )}

          <div className="grid items-start gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
            {/* فهرست بخش‌ها — min-w-0 lets the strip scroll sideways on narrow
                screens instead of stretching the whole page wider than it is */}
            <nav
              aria-label="بخش‌های پنل کاربری"
              className="min-w-0 lg:sticky lg:top-24"
            >
              <ul
                ref={tabsRef}
                className="flex w-full gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0"
              >
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = tab.id === activeTab;

                  return (
                    <li key={tab.id} className="shrink-0 lg:shrink">
                      <button
                        type="button"
                        onClick={() => goToTab(tab.id)}
                        aria-current={isActive ? "true" : undefined}
                        className={`flex w-full cursor-pointer items-center gap-2.5 whitespace-nowrap rounded-2xl border px-4 py-3 text-sm font-medium transition-colors duration-200 ${
                          isActive
                            ? "border-qandek-pink/60 bg-cocoa text-white shadow-md"
                            : "border-white/80 bg-white/80 text-cocoa/75 hover:bg-qandek-peach/40 hover:text-cocoa"
                        }`}
                      >
                        <Icon
                          aria-hidden="true"
                          strokeWidth={1.7}
                          className={`h-[18px] w-[18px] shrink-0 ${
                            isActive ? "text-qandek-peach" : "text-caramel"
                          }`}
                        />
                        {tab.label}
                      </button>
                    </li>
                  );
                })}
              </ul>

              <button
                type="button"
                onClick={handleSignOut}
                className="mt-4 hidden w-full cursor-pointer items-center gap-2.5 rounded-2xl border border-berry/25 bg-berry/5 px-4 py-3 text-sm font-medium text-berry transition-colors duration-200 hover:bg-berry/10 lg:flex"
              >
                <LogOut aria-hidden="true" strokeWidth={1.7} className="h-[18px] w-[18px] shrink-0" />
                خروج از حساب
              </button>
            </nav>

            {/* بخش انتخاب‌شده */}
            <div className="min-w-0 space-y-5">
              {activeTab === "overview" && (
                <AccountOverview
                  user={user}
                  orders={MOCK_ORDERS}
                  addresses={MOCK_ADDRESSES}
                  onOpenOrders={() => goToTab("orders")}
                  onOpenReceipts={() => goToTab("receipts")}
                />
              )}

              {activeTab === "orders" && <AccountOrders orders={MOCK_ORDERS} />}

              {activeTab === "receipts" && <AccountReceipts receipts={MOCK_RECEIPTS} />}

              {activeTab === "addresses" && <AccountAddresses addresses={MOCK_ADDRESSES} />}

              {activeTab === "favorites" && <AccountFavorites favorites={MOCK_FAVORITES} />}

              {activeTab === "profile" && <AccountProfile user={user} />}

              {activeTab === "security" && <AccountSecurity user={user} onSignOut={handleSignOut} />}
            </div>
          </div>

          <div className="mt-6 lg:hidden">
            <button
              type="button"
              onClick={handleSignOut}
              className="flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-2xl border border-berry/25 bg-berry/5 px-4 py-3 text-sm font-medium text-berry transition-colors duration-200 hover:bg-berry/10"
            >
              <LogOut aria-hidden="true" strokeWidth={1.7} className="h-[18px] w-[18px]" />
              خروج از حساب
            </button>
          </div>
        </div>
      </Container>
    </AccountBackground>
  );
}

/**
 * The page background: the same soft pink wash and baked-goods photo the cart
 * and order pages use, so the panel sits inside the shop rather than beside it.
 */
function AccountBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#fff9f7]">
      <div className="pointer-events-none absolute inset-0 -z-0 hidden lg:block">
        <Image
          src="/images/decor/products-bg-desktop.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-white/50" />
      </div>

      <div className="pointer-events-none absolute inset-0 -z-0 lg:hidden">
        <Image
          src="/images/decor/products-bg-mobile.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-white/55" />
      </div>

      <div className="relative z-10 py-6 sm:py-10 lg:py-12">{children}</div>
    </div>
  );
}
