"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingBag } from "lucide-react";
import type { Product } from "@/types/product";
import { useCart } from "@/lib/cart/store";
import { getEffectiveProductPrice } from "@/lib/pricing";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const [isFavorite, setIsFavorite] = useState(false);
  const displayPrice = getEffectiveProductPrice(product);

  const handleQuickAdd = (event: React.MouseEvent<HTMLButtonElement>) => {
    // کارت ممکن است داخل ناحیه‌ای قرار بگیرد که کلیک را به لینک محصول می‌برد
    event.preventDefault();
    event.stopPropagation();
    addItem(product, {}, 1);
  };

  return (
    <div className="group relative aspect-[3/4] w-full overflow-hidden rounded-3xl shadow-md transition-shadow hover:shadow-xl">
      {/* عکس محصول - تمام‌کارت */}
      <Link href={`/products/${product.slug}`} className="absolute inset-0">
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </Link>

      {/* گرادیانت تیره از پایین برای خوانایی متن */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

      {/* بج تخفیف */}
      {product.discountPrice && (
        <span className="absolute right-3 top-3 rounded-full bg-berry px-2.5 py-1 text-xs font-medium text-white">
          تخفیف
        </span>
      )}

      {/* آیکون علاقه‌مندی */}
      <button
        type="button"
        aria-label={
          isFavorite ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"
        }
        onClick={(e) => {
          e.preventDefault();
          setIsFavorite((v) => !v);
        }}
        className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-sm transition hover:bg-black/35"
      >
        <Heart
          className={`h-5 w-5 transition-all ${
            isFavorite ? "fill-berry stroke-berry" : "fill-none stroke-white"
          }`}
        />
      </button>
      {/* محتوای پایین کارت */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-2 sm:gap-2 sm:p-3 lg:p-4">
        <Link href={`/products/${product.slug}`}>
          <h3 className="text-[11px] font-bold text-white sm:text-sm lg:text-base">
            {product.name}
          </h3>
        </Link>

        <p className="line-clamp-1 text-[9px] leading-3.5 text-white/70 sm:text-xs sm:leading-5"></p>

        <div className="mt-0.5 flex min-w-0 flex-wrap items-baseline gap-1 sm:mt-1 sm:gap-2">
          {product.discountPrice && (
            <span className="text-[8px] text-white/50 line-through sm:text-[10px] lg:text-xs">
              {product.price.toLocaleString("fa-IR")} تومان
            </span>
          )}

          <span className="text-[11px] font-bold text-white sm:text-sm lg:text-base">
            {displayPrice.toLocaleString("fa-IR")} تومان
          </span>
        </div>

        <div className="mt-1 flex min-w-0 items-center gap-1.5 sm:mt-2 sm:gap-3">
          <button
            type="button"
            aria-label="افزودن سریع به سبد"
            disabled={!product.inStock}
            onClick={handleQuickAdd}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-white/70 text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40 sm:h-9 sm:w-9 lg:h-11 lg:w-11"
          >
            <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
          </button>

          <button
            type="button"
            disabled={!product.inStock}
            onClick={handleQuickAdd}
            className="flex h-6 min-w-0 flex-1 items-center justify-center rounded-full bg-qandek-strawberry px-1.5 text-[9px] font-bold text-white transition hover:bg-qandek-strawberry/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-white/30 sm:h-7 sm:px-2 sm:text-xs lg:h-8 lg:px-3 lg:text-sm"
          >
            {product.inStock ? "افزودن به سبد" : "ناموجود"}
          </button>
        </div>
      </div>
    </div>
  );
}
