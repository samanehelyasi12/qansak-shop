"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";
import type { Product } from "@/types/product";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const displayPrice = product.discountPrice || product.price;

  return (
    <div className="group relative aspect-[3/4] w-full overflow-hidden rounded-3xl shadow-md transition-shadow hover:shadow-xl">
      {/* عکس محصول - تمام‌کارت */}
      <Link href={`/products/${product.slug}`} className="absolute inset-0">
        <img
          src={product.images[0]}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
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
        aria-label={isFavorite ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}
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
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-4">
        <Link href={`/products/${product.slug}`}>
         <h3 className="text-sm font-bold text-white sm:text-base">{product.name}</h3>
        </Link>

        <p className="line-clamp-1 text-xs leading-5 text-white/70">
        </p>

        <div className="mt-1 flex items-baseline gap-2">
          {product.discountPrice && (
            <span className="text-xs text-white/50 line-through">
              {product.price.toLocaleString("fa-IR")} تومان
            </span>
          )}
          <span className="text-base font-bold text-white">
            {displayPrice.toLocaleString("fa-IR")} تومان
          </span>
        </div>

        <div className="mt-2 flex items-center gap-3">
          <button
            type="button"
            aria-label="افزودن سریع به سبد"
            disabled={!product.inStock}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-white/70 text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ShoppingBag className="h-5 w-5" />
          
          </button>

          <button
            type="button"
            disabled={!product.inStock}
            className="flex h-7 flex-1 items-center justify-center rounded-full bg-qandek-strawberry text-sm font-bold text-white transition hover:bg-qandek-strawberry/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-white/30"
          >
            {product.inStock ? "افزودن به سبد" : "ناموجود"}
          </button>
        </div>
      </div>
    </div>
  );
}