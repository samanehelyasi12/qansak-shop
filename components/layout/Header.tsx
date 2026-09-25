"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useMemo, useRef } from "react";
import { getAllCategories } from "@/data/categories";
import { searchProducts } from "@/data/search";
import { getEffectiveProductPrice } from "@/lib/pricing";
import Container from "@/components/ui/Container";

const categories = getAllCategories();
const categoryNameBySlug = new Map(
  categories.map((category) => [category.slug, category.name]),
);

const navItems = [
  { label: "خانه", href: "/" },
  { label: "فروشگاه", href: "/products" },
  { label: "دسته‌بندی‌ها", href: "#", hasDropdown: true },
  { label: "درباره ما", href: "/about" },
  
];

function isActive(href: string, pathname: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** المان‌هایی که فوکوس می‌تواند روی آن‌ها قرار بگیرد (برای حبس فوکوس در کشو). */
const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isMobileCategoriesOpen, setIsMobileCategoriesOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLElement>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);

  const suggestions = useMemo(() => {
    const trimmed = searchQuery.trim();
    return trimmed ? searchProducts(trimmed).slice(0, 5) : [];
  }, [searchQuery]);

  const isCategoriesActive = pathname.startsWith("/categories/");
  const isHomeActive = pathname === "/";

  function closeAll() {
    setIsMobileMenuOpen(false);
    setIsSearchOpen(false);
    setIsCategoriesOpen(false);
    setIsMobileCategoriesOpen(false);
  }

  function openMobileSearch() {
    setIsMobileMenuOpen(false);
    setIsMobileCategoriesOpen(false);
    setIsSearchOpen(true);
  }

  function handleSearchSubmit(event: React.FormEvent) {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      return;
    }
    setIsSearchOpen(false);
    setSearchQuery("");
    router.push(`/search?q=${encodeURIComponent(query)}`);
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCategoriesOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeAll();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsSearchOpen(false);
    setIsCategoriesOpen(false);
    setIsMobileCategoriesOpen(false);
  }, [pathname]);

  /**
   * کشوی موبایل یک ناحیهٔ مودال است: فوکوس باید داخل آن بماند،
   * هنگام باز شدن به داخل برود و بعد از بسته شدن به دکمهٔ بازکننده برگردد.
   * هیچ تغییری در ظاهر/انیمیشن کشو ایجاد نمی‌شود.
   */
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const root = mobileMenuRef.current;
    root?.focus();

    const getFocusable = () => {
      if (!root) return [] as HTMLElement[];
      return Array.from(
        root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((element) => element.offsetParent !== null);
    };

    const handleTrap = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const focusable = getFocusable();
      if (focusable.length === 0) {
        event.preventDefault();
        root?.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey) {
        if (active === first || active === root) {
          event.preventDefault();
          last.focus();
        }
        return;
      }
      if (active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleTrap);

    return () => {
      document.removeEventListener("keydown", handleTrap);
      previouslyFocused?.focus?.();
    };
  }, [isMobileMenuOpen]);

  return (
    <header className="sticky top-0 z-50">
      <div className="rounded-2xl border border-qandek-pink/40 bg-qandek-milk/80 shadow-sm backdrop-blur ">
        <div className="h-16 md:h-17">
          <Container className="h-full">
            <div className="flex h-full items-center justify-between gap-4">
              <div className="flex flex-1 items-center justify-start">
                <Link
                  href="/"
                  className="flex shrink-0 cursor-pointer items-center transition-transform duration-200 hover:scale-[1.03]"
                  aria-label="قندک - صفحه اصلی"
                >
                  <Image
                    src="/images/hero/logo.webp"
                    alt="قندک"
                    width={1512}
                    height={526}
                    className="h-8 w-auto object-contain md:h-9"
                    priority
                  />
                </Link>
              </div>

              <nav
                className="hidden flex-1 items-center justify-center gap-0.5 md:flex lg:gap-1"
                aria-label="منوی اصلی"
              >
                {navItems.map((item) => {
                  const itemActive = item.hasDropdown
                    ? isCategoriesActive
                    : isActive(item.href, pathname);

                  return (
                    <div key={item.label} className="relative">
                      {item.hasDropdown ? (
                        <div
                          ref={dropdownRef}
                          className="relative"
                          onMouseEnter={() => setIsCategoriesOpen(true)}
                          onMouseLeave={() => setIsCategoriesOpen(false)}
                          onBlur={(event) => {
                            if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                              setIsCategoriesOpen(false);
                            }
                          }}
                        >
                          <button
                            type="button"
                            aria-haspopup="true"
                            aria-expanded={isCategoriesOpen}
                            aria-controls="categories-dropdown"
                            onClick={() => setIsCategoriesOpen((previous) => !previous)}
                            onFocus={() => setIsCategoriesOpen(true)}
                            className={`flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-full px-2 py-1.5 text-[11px] font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-qandek-peach md:px-3 md:text-xs ${
                              itemActive || isCategoriesOpen
                                ? "bg-qandek-peach/70 text-qandek-brown"
                                : "text-cocoa hover:bg-qandek-peach/50 hover:text-qandek-brown"
                            }`}
                          >
                            {item.label}
                            <svg
                              className={`h-3 w-3 transition-transform duration-200 ${isCategoriesOpen ? "rotate-180" : ""}`}
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              aria-hidden="true"
                            >
                              <path
                                fillRule="evenodd"
                                d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>

                          {isCategoriesOpen && (
                            <div
                              className="absolute right-0 top-full z-50 min-w-[180px]"
                              onMouseEnter={() => setIsCategoriesOpen(true)}
                              onMouseLeave={() => setIsCategoriesOpen(false)}
                            >
                              <div className="pt-2">
                                <ul
                                  id="categories-dropdown"
                                  className="animate-fade-slide overflow-hidden rounded-xl border border-qandek-pink/40 bg-white py-2 shadow-lg"
                                >
                                  {categories.map((category) => (
                                    <li key={category.id}>
                                      <Link
                                        href={`/categories/${category.slug}`}
                                        onClick={() => setIsCategoriesOpen(false)}
                                        className="block cursor-pointer px-4 py-2.5 text-sm text-cocoa transition-colors duration-150 hover:bg-qandek-pink/30 hover:text-qandek-brown"
                                      >
                                        {category.name}
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <Link
                          href={item.href}
                          aria-current={itemActive ? "page" : undefined}
                          className={`flex cursor-pointer items-center whitespace-nowrap rounded-full px-2 py-1.5 text-[11px] font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-qandek-peach md:px-3 md:text-xs ${
                            isHomeActive && item.href === "/"
                              ? "bg-qandek-peach/70 text-qandek-brown"
                              : itemActive
                                ? "bg-qandek-peach/70 text-qandek-brown"
                                : "text-cocoa hover:bg-qandek-peach/50 hover:text-qandek-brown"
                          }`}
                        >
                          {item.label}
                        </Link>
                      )}
                    </div>
                  );
                })}
              </nav>

              <div className="flex flex-1 items-center justify-end ">
                <div className="flex items-center gap-1 md:gap-2">
                  <div ref={searchRef} className="relative ">
                    <button
                      type="button"
                      aria-label="جستجو"
                      aria-expanded={isSearchOpen}
                      onClick={() => setIsSearchOpen((previous) => !previous)}
                      className="cursor-pointer rounded-lg p-2 text-cocoa transition-colors duration-200 hover:bg-qandek-peach/50 hover:text-qandek-brown focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-qandek-peach"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                      </svg>
                    </button>

                    {isSearchOpen && (
                      <div
                        role="search"
                        aria-label="جستجوی محصولات"
                        className="absolute mr-[-150px] top-full right-0 z-50 mt-2 w-[19rem] max-w-[calc(100vw-3rem)] animate-fade-slide overflow-hidden rounded-2xl border border-qandek-pink/40 bg-white shadow-xl"
                      >
                        <form className="border-b border-qandek-pink/20 p-3" onSubmit={handleSearchSubmit}>
                          <div className="relative flex items-center gap-2">
                            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-qandek-brownLight">
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                              </svg>
                            </span>
                            <input
                              type="search"
                              name="q"
                              aria-label="جستجوی محصولات"
                              value={searchQuery}
                              onChange={(event) => setSearchQuery(event.target.value)}
                              placeholder="جستجو در قندک..."
                              autoFocus
                              enterKeyHint="search"
                              className="w-full rounded-xl border border-qandek-pink/40 bg-qandek-milk py-2 pl-3 pr-9 text-sm text-cocoa placeholder:text-cocoa/40 focus:outline-none focus:ring-2 focus:ring-qandek-peach"
                            />
                            <button
                              type="submit"
                              className="shrink-0 cursor-pointer rounded-xl bg-qandek-pink px-3 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-qandek-strawberry focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-qandek-peach"
                            >
                              جستجو
                            </button>
                          </div>
                        </form>

                        <div className="max-h-56 overflow-y-auto">
                          {searchQuery.trim() &&
                            (suggestions.length > 0 ? (
                              <ul aria-label="پیشنهادهای جستجو">
                                {suggestions.map((product) => (
                                  <li key={product.id}>
                                    <Link
                                      href={`/products/${product.slug}`}
                                      onClick={() => {
                                        setIsSearchOpen(false);
                                        setSearchQuery("");
                                      }}
                                      className="flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors duration-150 hover:bg-qandek-pink/20"
                                    >
                                      <img
                                        src={product.images[0]}
                                        alt=""
                                        className="h-9 w-9 shrink-0 rounded-lg bg-qandek-pink/20 object-cover"
                                      />
                                      <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm text-cocoa">
                                          {product.name}
                                        </span>
                                        <span className="block text-xs text-qandek-brownLight">
                                          {categoryNameBySlug.get(product.categorySlug)}
                                        </span>
                                      </span>
                                      <span className="shrink-0 text-xs font-medium text-qandek-strawberry">
                                        {getEffectiveProductPrice(product).toLocaleString("fa-IR")} ت
                                      </span>
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="px-3 py-4 text-center text-sm text-cocoa/60">
                                نتیجه‌ای برای «{searchQuery}» پیدا نشد.
                              </p>
                            ))}
                        </div>

                        <p className="bg-qandek-milk px-3 py-2 text-center text-[11px] text-cocoa/50">
                          برای مشاهده همه نتایج، Enter را بزنید
                        </p>
                      </div>
                    )}
                  </div>

                  <Link
                    href="/login"
                    aria-label="ورود و حساب کاربری"
                    className="hidden cursor-pointer rounded-lg p-2 text-cocoa transition-colors duration-200 hover:bg-qandek-peach/50 hover:text-qandek-brown focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-qandek-peach sm:block"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                    </svg>
                  </Link>

                  <Link
                    href="/cart"
                    aria-label="سبد خرید"
                    className="cursor-pointer rounded-lg p-2 text-cocoa transition-colors duration-200 hover:bg-qandek-peach/50 hover:text-qandek-brown focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-qandek-peach"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                    </svg>
                  </Link>

                  <button
                    type="button"
                    ref={mobileMenuButtonRef}
                    aria-label={isMobileMenuOpen ? "بستن منو" : "باز کردن منو"}
                    aria-expanded={isMobileMenuOpen}
                    onClick={() => setIsMobileMenuOpen((previous) => !previous)}
                    className="cursor-pointer rounded-lg p-2 text-cocoa transition-colors duration-200 hover:bg-qandek-peach/50 hover:text-qandek-brown focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-qandek-peach md:hidden"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
                      {isMobileMenuOpen ? (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                      )}
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </Container>
        </div>
      </div>

      {isMobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-cocoa/30 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <nav
            ref={mobileMenuRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-menu-title"
            tabIndex={-1}
            className="fixed inset-y-0 right-0 z-50 flex w-80 max-w-[85vw] animate-slide-in flex-col bg-white shadow-xl md:hidden"
          >
            <div className="flex items-center justify-between border-b border-qandek-pink/40 p-4">
              <span id="mobile-menu-title" className="text-lg font-bold text-qandek-strawberry">منو</span>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="بستن منو"
                className="cursor-pointer rounded-lg p-2 text-cocoa transition-colors duration-200 hover:bg-qandek-peach/50 hover:text-qandek-brown"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 space-y-1 overflow-y-auto p-4">
              {navItems.map((item) => {
                const itemActive = item.hasDropdown
                  ? isCategoriesActive
                  : isActive(item.href, pathname);

                return item.hasDropdown ? (
                  <div key={item.label} className="border-t border-qandek-pink/40 pt-3 mt-3">
                    <button
                      type="button"
                      aria-haspopup="true"
                      aria-expanded={isMobileCategoriesOpen}
                      onClick={() => setIsMobileCategoriesOpen((previous) => !previous)}
                      className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-4 py-3 text-base font-medium transition-colors duration-150 hover:bg-qandek-peach/50 hover:text-qandek-brown ${
                        itemActive || isMobileCategoriesOpen
                          ? "bg-qandek-peach/70 text-qandek-brown"
                          : "text-cocoa"
                      }`}
                    >
                      {item.label}
                      <svg
                        className={`h-4 w-4 transition-transform duration-200 ${isMobileCategoriesOpen ? "rotate-180" : ""}`}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                    {isMobileCategoriesOpen && (
                      <ul className="mt-2 space-y-1 border-r-2 border-qandek-pink/40 pr-2">
                        {categories.map((category) => (
                          <li key={category.id}>
                            <Link
                              href={`/categories/${category.slug}`}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="block cursor-pointer rounded-lg px-3 py-2 text-sm text-cocoa transition-colors duration-150 hover:bg-qandek-peach/50 hover:text-qandek-brown"
                            >
                              {category.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    aria-current={itemActive ? "page" : undefined}
                    className={`block cursor-pointer rounded-lg px-4 py-3 text-base font-medium transition-colors duration-150 ${
                      itemActive
                        ? "bg-qandek-peach/70 text-qandek-brown"
                        : "text-cocoa hover:bg-qandek-peach/50 hover:text-qandek-brown"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <div className="border-t border-qandek-pink/40 p-4">
              <button
                type="button"
                onClick={openMobileSearch}
                className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-base font-medium text-cocoa transition-colors duration-150 hover:bg-qandek-peach/50 hover:text-qandek-brown"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
                <span>جستجو</span>
              </button>
              <Link
                href="/cart"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-base font-medium text-cocoa transition-colors duration-150 hover:bg-qandek-peach/50 hover:text-qandek-brown"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                </svg>
                <span>سبد خرید</span>
              </Link>
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-base font-medium text-cocoa transition-colors duration-150 hover:bg-qandek-peach/50 hover:text-qandek-brown"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
                <span>ورود به حساب</span>
              </Link>
            </div>
          </nav>
        </>
      )}

      <style jsx global>{`
        @keyframes fadeSlideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideIn {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-fade-slide {
          animation: fadeSlideDown 0.2s ease-out;
        }
        .animate-slide-in {
          animation: slideIn 0.25s ease-out;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-fade-slide,
          .animate-slide-in {
            animation: none;
          }
        }
      `}</style>
    </header>
  );
}