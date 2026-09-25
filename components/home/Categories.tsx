"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getAllCategories } from "@/data/categories";
import Container from "@/components/ui/Container";
import SectionTitle from "@/components/ui/SectionTitle";

function getVisibleCount(width: number) {
  if (width >= 1280) return 6;
  if (width >= 1024) return 6;
  if (width >= 768) return 4;
  if (width >= 480) return 2;
  return 2.15;
}

export default function Categories() {
  const categories = getAllCategories();
  const [visibleCount, setVisibleCount] = useState(7);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const update = () => setVisibleCount(getVisibleCount(window.innerWidth));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const maxIndex = Math.max(0, categories.length - Math.floor(visibleCount));
  const itemWidthPercent = 100 / visibleCount;

  const goNext = () => setCurrentIndex((i) => Math.min(i + 1, maxIndex));
  const goPrev = () => setCurrentIndex((i) => Math.max(i - 1, 0));

  const isAtStart = currentIndex === 0;
  const isAtEnd = currentIndex >= maxIndex;

  return (
    <section className="py-14 bg-white" aria-labelledby="categories-title">
      <Container>
        <div className="mb-8 text-center">
          <div className="mx-auto flex max-w-2xl items-center justify-center gap-3 sm:gap-5">
            <img
              src="/images/decor/ribbon-left.png"
              alt=""
              aria-hidden="true"
              className="absolute z-10 h-8 shrink-0 mr-36 sm:h-11 sm:mr-48"
            />
            <h2
              id="categories-title"
              className="shrink-0 whitespace-nowrap text-2xl font-bold text-cocoa sm:text-3xl"
            >
              دسته‌بندی‌ها
            </h2>
            <img
              src="/images/decor/ribbon-right.webp"
              alt=""
              aria-hidden="true"
              className="absolute h-8 shrink-0 ml-36 sm:h-11 sm:ml-44"
            />
          </div>
          <p className="mt-3 text-cocoa/70">
            همه چیزش اینجاست، فقط کافیه انتخاب کنی
          </p>
        </div>

        <div className="relative overflow-hidden rounded-[2rem] bg-pink-100 border border-pink-200 px-3 py-3 shadow-[0_8px_32px_rgba(228,144,150,0.15)] backdrop-blur-md sm:px-10">
          {/* دکمه قبلی */}
          <button
            type="button"
            aria-label="دسته‌بندی قبلی"
            onClick={goPrev}
            disabled={isAtStart}
            className="absolute right-1 top-1/2 z-10 flex -translate-y-1/2 items-center justify-center rounded-full bg-white/80 p-2 shadow-md backdrop-blur-sm transition hover:scale-105 hover:bg-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:scale-100 sm:p-2.5"
          >
            <ArrowRight className="h-4 w-4 text-qandek-brown sm:h-5 sm:w-5" />
          </button>

          {/* دکمه بعدی */}
          <button
            type="button"
            aria-label="دسته‌بندی بعدی"
            onClick={goNext}
            disabled={isAtEnd}
            className="absolute left-1 top-1/2 z-10 flex -translate-y-1/2 items-center justify-center rounded-full bg-white/80 p-2 shadow-md backdrop-blur-sm transition hover:scale-105 hover:bg-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:scale-100 sm:p-2.5"
          >
            <ArrowLeft className="h-4 w-4 text-qandek-brown sm:h-5 sm:w-5" />
          </button>

          {/* viewport */}
          <div className="overflow-hidden px-6 sm:px-8">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{
                transform: `translateX(${currentIndex * itemWidthPercent}%)`,
              }}
            >
              {categories.map((category, index) => (
                <div
                  key={category.id}
                  className="relative flex shrink-0 justify-center"
                  style={{ width: `${itemWidthPercent}%` }}
                >
                  {/* خط‌چین جداکننده، بین آیتم‌ها (نه بعد از آخری) */}
                  {index !== categories.length - 1 && (
                    <span
                      className="absolute top-1/2 h-16 w-px -translate-y-1/2 border-r border-dashed border-qandek-brown/20 sm:h-20"
                      style={{ insetInlineEnd: 0 }}
                      aria-hidden="true"
                    />
                  )}

                  <Link
                    href={`/categories/${category.slug}`}
                    className="group flex flex-col items-center gap-3 px-1 sm:gap-4"
                    style={{ textDecoration: "none" }}
                  >
                    <div className="relative mt-2 aspect-square w-20 overflow-hidden rounded-full ring-1 ring-black/5 transition-transform duration-200 group-hover:scale-105 sm:w-28">
                      <Image
                        src={category.image}
                        alt={category.name}
                        fill
                        sizes="120px"
                        className="object-cover"
                      />
                    </div>
                    <span
                      className="line-clamp-1 text-center text-xs font-semibold leading-tight text-qandek-brown sm:text-sm"
                      style={{ textDecoration: "none" }}
                    >
                      {category.name}
                    </span>
                    <span className="h-[3px] w-6 rounded-full bg-pink-200 sm:w-8" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
