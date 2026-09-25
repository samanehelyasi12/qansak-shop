"use client";

import type { Product } from "@/types/product";
import { useState } from "react";
import Image from "next/image";

interface ProductGalleryProps {
  product: Product;
}

// حداکثر تعداد تصویر کوچک زیر عکس اصلی
const MAX_THUMBNAILS = 3;

export default function ProductGallery({ product }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const images = product.images?.length ? product.images : [];
  const thumbnails = images.slice(0, MAX_THUMBNAILS);
  const hasMultipleImages = images.length > 1;

  return (
    <div className="space-y-3">
      {/* عکس اصلی */}
      <div
        id="product-gallery-main"
        className="relative aspect-square w-full overflow-hidden rounded-2xl bg-cream sm:aspect-[4/3]"
      >
        {images.length > 0 && (
          <Image
            src={images[selectedIndex]}
            alt={`${product.name} - عکس ${selectedIndex + 1}`}
            fill
            // This is the product page's LCP image, so it is preloaded.
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        )}
      </div>

      {/* عکس‌های کوچک - فقط وقتی بیشتر از یک عکس وجود دارد نمایش داده می‌شود */}
      {hasMultipleImages && (
        <div className="grid grid-cols-3 gap-2">
          {thumbnails.map((image, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setSelectedIndex(index)}
              className={`aspect-square w-full overflow-hidden rounded-xl border-2 transition ${
                index === selectedIndex
                  ? "border-caramel"
                  : "border-cream hover:border-caramel/50"
              }`}
              aria-label={`نمایش عکس ${index + 1} از ${product.name}`}
              aria-controls="product-gallery-main"
              aria-pressed={index === selectedIndex}
            >
              <Image
                src={image}
                alt=""
                width={256}
                height={256}
                sizes="96px"
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}