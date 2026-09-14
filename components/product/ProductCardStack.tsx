"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "./ProductCard";
import type { Product } from "@/types/product";

interface ProductCardStackProps {
  products: Product[];
}

export default function ProductCardStack({ products }: ProductCardStackProps) {
  const [index, setIndex] = useState(0);
  const total = products.length;

  const next = () => setIndex((i) => (i + 1) % total);
  const prev = () => setIndex((i) => (i - 1 + total) % total);

  // فقط ۴ تا کارت پشت‌سرهم نشون بده (جلویی + ۳ تا پشتش)
  const visibleStack = [0, 1, 2, 3].map((offset) => {
    const i = (index + offset) % total;
    return { product: products[i], offset };
  });

  return (
    <div className="flex items-center justify-center gap-4 sm:gap-8">
      <button
        type="button"
        aria-label="محصول قبلی"
        onClick={prev}
        className="z-30 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-qandek-brown shadow-md transition hover:scale-105 hover:bg-qandek-cream sm:h-12 sm:w-12"
      >
        <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
      </button>

      <div className="relative h-[440px] w-[260px] sm:h-[500px] sm:w-[300px]">
        {visibleStack
          .slice()
          .reverse()
          .map(({ product, offset }) => {
            const translateY = offset * 14;
            const translateX = offset * 10;
            const rotate = offset * 4;
            const scale = 1 - offset * 0.06;
            const opacity = offset === 3 ? 0 : 1 - offset * 0.18;

            return (
              <div
                key={product.id}
                className="absolute inset-0 transition-all duration-500 ease-out"
                style={{
                  transform: `translate(${translateX}px, ${translateY}px) rotate(${rotate}deg) scale(${scale})`,
                  zIndex: 10 - offset,
                  opacity,
                }}
              >
                <ProductCard product={product} />
              </div>
            );
          })}
      </div>

      <button
        type="button"
        aria-label="محصول بعدی"
        onClick={next}
        className="z-30 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-qandek-brown shadow-md transition hover:scale-105 hover:bg-qandek-cream sm:h-12 sm:w-12"
      >
        <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
      </button>
    </div>
  );
}