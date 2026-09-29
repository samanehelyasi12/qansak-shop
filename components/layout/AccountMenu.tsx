"use client";

/**
 * The account button in the header.
 *
 * When nobody is signed in this is exactly the sign-in link that was there
 * before. When somebody is signed in it becomes a button carrying their name,
 * which opens the menu with their account panel and the way out.
 *
 * The name comes from `useAccountSession`, never from anything typed or stored
 * in the browser, so a person cannot put a name there who is not signed in.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  LayoutGrid,
  LogOut,
  MapPin,
  Package,
  Receipt,
} from "lucide-react";

import { accountSession } from "@/lib/account/session";
import { useAccountSession } from "@/lib/account/useAccountSession";
import { getInitial } from "@/lib/account/format";

const menuLinks = [
  { label: "پنل کاربری", href: "/account", icon: LayoutGrid },
  { label: "سفارش‌های من", href: "/account#orders", icon: Package },
  { label: "رسیدهای من", href: "/account#receipts", icon: Receipt },
  { label: "آدرس‌های من", href: "/account#addresses", icon: MapPin },
];

export default function AccountMenu() {
  const router = useRouter();
  const { status, user } = useAccountSession();

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (!isOpen) return;
      setIsOpen(false);
      buttonRef.current?.focus();
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Signing out takes the panel away with the session, so nothing may be left
  // open pointing at it.
  useEffect(() => {
    if (status !== "authenticated") setIsOpen(false);
  }, [status]);

  // While the session is being asked about, neither the name nor the sign-in
  // icon has been earned yet, so a neutral placeholder holds the space
  // instead of the header flickering between the two.
  if (status === "loading") {
    return (
      <div
        aria-hidden="true"
        className="hidden h-9 w-28 animate-pulse rounded-full border border-qandek-pink/40 bg-white/50 sm:block"
      />
    );
  }

  if (status !== "authenticated" || !user) {
    return (
      <Link
        href="/login"
        aria-label="ورود و حساب کاربری"
        className="hidden cursor-pointer rounded-lg p-2 text-cocoa transition-colors duration-200 hover:bg-qandek-peach/50 hover:text-qandek-brown focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-qandek-peach sm:block"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>
      </Link>
    );
  }

  function handleSignOut() {
    setIsOpen(false);
    // The name must be gone the moment they leave, and the session must be
    // ended on the backend too — so both, before the page moves on.
    void accountSession.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div ref={containerRef} className="relative hidden sm:block">
      <button
        type="button"
        ref={buttonRef}
        onClick={() => setIsOpen((previous) => !previous)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="حساب کاربری من"
        className="flex cursor-pointer items-center gap-2 rounded-full border border-qandek-pink/50 bg-white/70 py-1 pl-3 pr-1 text-cocoa transition-colors duration-200 hover:bg-qandek-peach/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-qandek-peach"
      >
        <span
          aria-hidden="true"
          className="flex h-7 w-7 items-center justify-center rounded-full bg-cocoa text-xs font-bold text-white"
        >
          {getInitial(user.displayName)}
        </span>

        <span className="max-w-[7rem] truncate text-xs font-medium">
          {user.displayName}
        </span>

        <ChevronDown
          aria-hidden="true"
          strokeWidth={2}
          className={`h-3.5 w-3.5 shrink-0 text-cocoa/60 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-2 w-64 animate-fade-slide overflow-hidden rounded-2xl border border-qandek-pink/40 bg-white shadow-xl">
          <div className="flex items-center gap-3 border-b border-qandek-pink/20 bg-qandek-cream/40 px-4 py-3">
            <span
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cocoa text-sm font-bold text-white"
            >
              {getInitial(user.displayName)}
            </span>

            <span className="min-w-0">
              <span className="block truncate text-sm font-bold text-cocoa">
                {user.displayName}
              </span>
              {(user.phone || user.email) && (
                <span className="block truncate text-[11px] text-cocoa/55" dir="ltr">
                  {user.phone ?? user.email}
                </span>
              )}
            </span>
          </div>

          <ul className="py-1.5">
            {menuLinks.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-cocoa transition-colors duration-150 hover:bg-qandek-pink/25 hover:text-qandek-brown"
                  >
                    <Icon aria-hidden="true" strokeWidth={1.6} className="h-4 w-4 shrink-0 text-caramel" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="border-t border-qandek-pink/20 p-1.5">
            <button
              type="button"
              onClick={handleSignOut}
              className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-berry transition-colors duration-150 hover:bg-berry/10"
            >
              <LogOut aria-hidden="true" strokeWidth={1.6} className="h-4 w-4 shrink-0" />
              خروج از حساب
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * The same account entry for the mobile drawer, where a hover menu has no room
 * to open. Signed out it is the sign-in link; signed in it carries the name and
 * the two things a person actually wants from there: the panel and signing out.
 */
export function AccountDrawerEntry({
  onNavigate,
}: {
  onNavigate: () => void;
}) {
  const router = useRouter();
  const { status, user } = useAccountSession();

  if (status !== "authenticated" || !user) {
    return (
      <Link
        href="/login"
        onClick={onNavigate}
        className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-base font-medium text-cocoa transition-colors duration-150 hover:bg-qandek-peach/50 hover:text-qandek-brown"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>
        <span>ورود به حساب</span>
      </Link>
    );
  }

  function handleSignOut() {
    onNavigate();
    void accountSession.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-qandek-pink/40 bg-qandek-cream/40 p-3">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cocoa text-sm font-bold text-white"
        >
          {getInitial(user.displayName)}
        </span>

        <span className="min-w-0">
          <span className="block truncate text-sm font-bold text-cocoa">
            {user.displayName}
          </span>
          {(user.phone || user.email) && (
            <span className="block truncate text-[11px] text-cocoa/55" dir="ltr">
              {user.phone ?? user.email}
            </span>
          )}
        </span>
      </div>

      <Link
        href="/account"
        onClick={onNavigate}
        className="mt-3 flex w-full cursor-pointer items-center gap-2 rounded-lg bg-cocoa px-3 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-caramel"
      >
        <LayoutGrid aria-hidden="true" strokeWidth={1.6} className="h-4 w-4 shrink-0" />
        ورود به پنل کاربری
      </Link>

      <button
        type="button"
        onClick={handleSignOut}
        className="mt-2 flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-berry transition-colors duration-150 hover:bg-berry/10"
      >
        <LogOut aria-hidden="true" strokeWidth={1.6} className="h-4 w-4 shrink-0" />
        خروج از حساب
      </button>
    </div>
  );
}
