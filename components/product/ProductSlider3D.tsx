"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "./ProductCard";
import type { Product } from "@/types/product";

interface ProductSlider3DProps {
  products: Product[];
}

type ScreenType = "mobile" | "tablet" | "desktop";

export default function ProductSlider3D({
  products,
}: ProductSlider3DProps) {
  const [index, setIndex] = useState(0);
  const [screen, setScreen] = useState<ScreenType>("mobile");

  const total = products.length;

  useEffect(() => {
    const updateScreen = () => {
      const width = window.innerWidth;

      if (width < 640) {
        setScreen("mobile");
      } else if (width < 1024) {
        setScreen("tablet");
      } else {
        setScreen("desktop");
      }
    };

    updateScreen();

    window.addEventListener("resize", updateScreen);

    return () => {
      window.removeEventListener("resize", updateScreen);
    };
  }, []);

  /*
    تعداد کارت‌های قابل مشاهده:
    موبایل  = 3
    تبلت    = 3
    دسکتاپ  = 5
  */
  const visibleSideCount = screen === "desktop" ? 2 : 1;

  /*
    عرض هر کارت
    موبایل کوچک‌تر
    تبلت متوسط
    دسکتاپ همان 260px قبلی
  */
  const cardWidth =
    screen === "mobile"
      ? 165
      : screen === "tablet"
        ? 215
        : 260;

  /*
    فاصله افقی کارت‌ها
    برای جلوگیری از بیرون‌زدگی در موبایل
  */
  const translateDistance =
    screen === "mobile"
      ? 92
      : screen === "tablet"
        ? 135
        : 190;

  /*
    ارتفاع stage
  */
  const stageHeight =
    screen === "mobile"
      ? "360px"
      : screen === "tablet"
        ? "430px"
        : "480px";

  /*
    اندازه دکمه‌ها
  */
  const buttonSize =
    screen === "mobile"
      ? "h-9 w-9"
      : screen === "tablet"
        ? "h-10 w-10"
        : "h-11 w-11";

  const next = () => {
    if (total === 0) return;

    setIndex((current) => (current + 1) % total);
  };

  const prev = () => {
    if (total === 0) return;

    setIndex((current) => (current - 1 + total) % total);
  };

  if (total === 0) {
    return null;
  }

  return (
    <div className="relative flex w-full min-w-0 items-center justify-center gap-1 sm:gap-2 lg:gap-4">
      {/* =========================
          دکمه سمت راست
         ========================= */}
      <button
        type="button"
        aria-label="محصول قبلی"
        onClick={prev}
        className={`z-30 ${buttonSize} flex shrink-0 items-center justify-center rounded-full bg-white text-qandek-brown shadow-md transition hover:scale-105 hover:bg-qandek-cream`}
      >
        <ChevronRight
          className={
            screen === "desktop"
              ? "h-6 w-6"
              : screen === "tablet"
                ? "h-5 w-5"
                : "h-4 w-4"
          }
        />
      </button>

      {/* =========================
          Stage
         ========================= */}
      <div
        className="relative min-w-0 flex-1 overflow-hidden"
        style={{
          height: stageHeight,
          perspective: "1600px",
        }}
      >
        {products.map((product, i) => {
          let offset = i - index;

          /*
            باعث می‌شود اسلایدر حالت چرخشی داشته باشد.
          */
          if (offset > total / 2) {
            offset -= total;
          }

          if (offset < -total / 2) {
            offset += total;
          }

          const abs = Math.abs(offset);

          /*
            موبایل / تبلت:
            مرکز + راست + چپ = 3 کارت

            دسکتاپ:
            دو کارت سمت راست + مرکز + دو کارت سمت چپ = 5 کارت
          */
          if (abs > visibleSideCount) {
            return null;
          }

          /*
            =========================
            مدل 3D اصلی خودت
            =========================
          */

          const translateX = offset * translateDistance;

          const scale =
            offset === 0
              ? 1
              : abs === 1
                ? 0.82
                : 0.64;

          const rotateY = offset * -22;

          const zIndex = 10 - abs;

          const opacity =
            offset === 0
              ? 1
              : abs === 1
                ? 0.85
                : 0.45;

          return (
            <div
              key={product.id}
              className="absolute left-1/2 top-1/2 transition-all duration-500 ease-out"
              style={{
                width: `${cardWidth}px`,
                transform: `
                  translate(-50%, -50%)
                  translateX(${translateX}px)
                  scale(${scale})
                  rotateY(${rotateY}deg)
                `,
                zIndex,
                opacity,
                transformStyle: "preserve-3d",
              }}
            >
              <ProductCard product={product} />
            </div>
          );
        })}
      </div>

      {/* =========================
          دکمه سمت چپ
         ========================= */}
      <button
        type="button"
        aria-label="محصول بعدی"
        onClick={next}
        className={`z-30 ${buttonSize} flex shrink-0 items-center justify-center rounded-full bg-white text-qandek-brown shadow-md transition hover:scale-105 hover:bg-qandek-cream`}
      >
        <ChevronLeft
          className={
            screen === "desktop"
              ? "h-6 w-6"
              : screen === "tablet"
                ? "h-5 w-5"
                : "h-4 w-4"
          }
        />
      </button>
    </div>
  );
}
