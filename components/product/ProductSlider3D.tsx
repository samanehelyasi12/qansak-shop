"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "./ProductCard";
import type { Product } from "@/types/product";

interface ProductSlider3DProps {
  products: Product[];
}

export default function ProductSlider3D({ products }: ProductSlider3DProps) {
  const [index, setIndex] = useState(0);
  const total = products.length;

  const next = () => setIndex((i) => (i + 1) % total);
  const prev = () => setIndex((i) => (i - 1 + total) % total);

  return (
    <div className="relative flex items-center justify-center gap-2 sm:gap-4">
      {/* دکمه سمت راست (قبلی، چون RTL) */}
      <button
        type="button"
        aria-label="محصول قبلی"
        onClick={prev}
        className="z-20 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-qandek-brown shadow-md transition hover:scale-105 hover:bg-qandek-cream sm:h-12 sm:w-12"
      >
        <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
      </button>

      {/* stage اسلایدر */}
      <div
        className="relative flex h-[420px] flex-1 items-center justify-center overflow-hidden sm:h-[480px]"
        style={{ perspective: "1600px" }}
      >
        {products.map((product, i) => {
          let offset = i - index;
          if (offset > total / 2) offset -= total;
          if (offset < -total / 2) offset += total;

          const abs = Math.abs(offset);
          if (abs > 2) return null;

          const translateX = offset * 190;
          const scale = offset === 0 ? 1 : abs === 1 ? 0.82 : 0.64;
          const rotateY = offset * -22;
          const zIndex = 10 - abs;
          const opacity = offset === 0 ? 1 : abs === 1 ? 0.85 : 0.45;

          return (
            <div
              key={product.id}
              className="absolute w-[220px] transition-all duration-500 ease-out sm:w-[260px]"
              style={{
                transform: `translateX(${translateX}px) scale(${scale}) rotateY(${rotateY}deg)`,
                zIndex,
                opacity,
              }}
            >
              <ProductCard product={product} />
            </div>
          );
        })}
      </div>

      {/* دکمه سمت چپ (بعدی، چون RTL) */}
      <button
        type="button"
        aria-label="محصول بعدی"
        onClick={next}
        className="z-20 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-qandek-brown shadow-md transition hover:scale-105 hover:bg-qandek-cream sm:h-12 sm:w-12"
      >
        <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
      </button>
    </div>
  );
}
