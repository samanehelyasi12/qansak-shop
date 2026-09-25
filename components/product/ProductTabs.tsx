"use client";

import { useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import type { Product } from "@/types/product";

// تا وقتی «reviews» به تایپ اصلی Product اضافه نشده،
// موقتاً همین‌جا تعریفش می‌کنیم تا ارور implicit any نگیریم
interface ProductReview {
  author: string;
  rating: number; // عدد ۱ تا ۵
  comment: string;
}

interface ProductTabsProps {
  product: Product & { reviews?: ProductReview[] };
}

type TabKey = "description" | "reviews";

const TAB_KEYS: TabKey[] = ["description", "reviews"];

export default function ProductTabs({ product }: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("description");
  const reviewCount = product.reviews?.length ?? 0;
  const tabRefs = useRef<Record<TabKey, HTMLButtonElement | null>>({
    description: null,
    reviews: null,
  });

  /**
   * رفتار استاندارد الگوی tab در ARIA:
   * فلش‌ها بین تب‌ها جابه‌جا می‌شوند و فوکوس همراه آن‌ها منتقل می‌شود،
   * Home/End به اولین/آخرین تب می‌رود.
   */
  const focusTab = (tab: TabKey) => {
    setActiveTab(tab);
    tabRefs.current[tab]?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const currentIndex = TAB_KEYS.indexOf(activeTab);

    let nextIndex: number | null = null;

    // در چیدمان RTL، «بعدی» به سمت چپ حرکت می‌کند و «قبلی» به سمت راست.
    switch (event.key) {
      case "ArrowLeft":
        nextIndex = (currentIndex + 1) % TAB_KEYS.length;
        break;
      case "ArrowRight":
        nextIndex = (currentIndex - 1 + TAB_KEYS.length) % TAB_KEYS.length;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = TAB_KEYS.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    focusTab(TAB_KEYS[nextIndex]);
  };

  return (
    <div className="rounded-2xl border border-cream bg-white/60 p-5 shadow-sm sm:p-6">
      {/* هدر تب‌ها */}
      <div
        role="tablist"
        aria-label="اطلاعات محصول"
        className="flex items-center gap-6 border-b border-cream sm:gap-8"
      >
        <button
          type="button"
          ref={(node) => {
            tabRefs.current.description = node;
          }}
          id="product-tab-description"
          aria-controls="product-panel-description"
          onClick={() => setActiveTab("description")}
          onKeyDown={handleKeyDown}
          className={`relative pb-3 text-sm font-bold transition sm:text-base ${
            activeTab === "description" ? "text-cocoa" : "text-cocoa/40 hover:text-cocoa/70"
          }`}
          aria-selected={activeTab === "description"}
          role="tab"
          tabIndex={activeTab === "description" ? 0 : -1}
        >
          توضیحات محصول
          {activeTab === "description" && (
            <span className="absolute inset-x-0 -bottom-[1px] h-0.5 rounded-full bg-caramel" />
          )}
        </button>

        <button
          type="button"
          ref={(node) => {
            tabRefs.current.reviews = node;
          }}
          id="product-tab-reviews"
          aria-controls="product-panel-reviews"
          onClick={() => setActiveTab("reviews")}
          onKeyDown={handleKeyDown}
          className={`relative flex items-center gap-1.5 pb-3 text-sm font-bold transition sm:text-base ${
            activeTab === "reviews" ? "text-cocoa" : "text-cocoa/40 hover:text-cocoa/70"
          }`}
          aria-selected={activeTab === "reviews"}
          role="tab"
          tabIndex={activeTab === "reviews" ? 0 : -1}
        >
          نظرات
          {reviewCount > 0 && (
            <span className="rounded-full bg-caramel/15 px-1.5 py-0.5 text-[10px] font-bold text-caramel">
              {reviewCount}
            </span>
          )}
          {activeTab === "reviews" && (
            <span className="absolute inset-x-0 -bottom-[1px] h-0.5 rounded-full bg-caramel" />
          )}
        </button>
      </div>

      {/* محتوای تب‌ها: هر دو پنل همیشه در DOM هستند تا aria-controls همیشه
          به یک ناحیهٔ واقعی اشاره کند؛ پنل غیرفعال hidden و از جریان خارج می‌شود. */}
      <div
        role="tabpanel"
        id="product-panel-description"
        aria-labelledby="product-tab-description"
        hidden={activeTab !== "description"}
        tabIndex={0}
        className="pt-5"
      >
        <p className="text-sm leading-8 text-cocoa/80 text-justify sm:text-base">
          {product.description}
        </p>
      </div>

      <div
        role="tabpanel"
        id="product-panel-reviews"
        aria-labelledby="product-tab-reviews"
        hidden={activeTab !== "reviews"}
        tabIndex={0}
        className="pt-5"
      >
        {reviewCount > 0 ? (
          <ul className="space-y-3">
            {product.reviews!.map((review, i) => (
              <li key={i} className="rounded-xl border border-cream p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-cocoa">{review.author}</span>
                  <span aria-hidden="true" className="text-caramel">
                    {"★".repeat(review.rating)}
                    {"☆".repeat(5 - review.rating)}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-cocoa/70">{review.comment}</p>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center gap-2 py-8 text-center text-cocoa/50">
            <span className="text-3xl" aria-hidden="true">💬</span>
            <p className="text-sm">هنوز نظری برای این محصول ثبت نشده است.</p>
          </div>
        )}
      </div>
    </div>
  );
}