"use client";

import { useState } from "react";
import type { Product } from "@/types/product";

interface ProductTabsProps {
  product: Product;
}

type TabKey = "description" | "reviews";

export default function ProductTabs({ product }: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("description");
  const reviewCount = product.reviews?.length ?? 0;

  return (
    <div className="rounded-2xl border border-cream bg-white/60 p-5 shadow-sm sm:p-6">
      {/* هدر تب‌ها */}
      <div className="flex items-center gap-6 border-b border-cream sm:gap-8">
        <button
          type="button"
          onClick={() => setActiveTab("description")}
          className={`relative pb-3 text-sm font-bold transition sm:text-base ${
            activeTab === "description" ? "text-cocoa" : "text-cocoa/40 hover:text-cocoa/70"
          }`}
          aria-selected={activeTab === "description"}
          role="tab"
        >
          توضیحات محصول
          {activeTab === "description" && (
            <span className="absolute inset-x-0 -bottom-[1px] h-0.5 rounded-full bg-caramel" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("reviews")}
          className={`relative flex items-center gap-1.5 pb-3 text-sm font-bold transition sm:text-base ${
            activeTab === "reviews" ? "text-cocoa" : "text-cocoa/40 hover:text-cocoa/70"
          }`}
          aria-selected={activeTab === "reviews"}
          role="tab"
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

      {/* محتوای تب‌ها */}
      <div className="pt-5">
        {activeTab === "description" ? (
          <p className="text-sm leading-8 text-cocoa/80 text-justify sm:text-base">
            {product.description}
          </p>
        ) : reviewCount > 0 ? (
          <ul className="space-y-3">
            {product.reviews!.map((review, i) => (
              <li key={i} className="rounded-xl border border-cream p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-cocoa">{review.author}</span>
                  <span className="text-caramel" aria-hidden="true">
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
            <span className="text-3xl" role="img" aria-hidden="true">💬</span>
            <p className="text-sm">هنوز نظری برای این محصول ثبت نشده است.</p>
          </div>
        )}
      </div>
    </div>
  );
}