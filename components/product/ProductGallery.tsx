"use client";

import type { Product } from "@/types/product";
import { useState } from "react";

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
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-cream sm:aspect-[4/3]">
        {images.length > 0 && (
          <img
            src={images[selectedIndex]}
            alt={`${product.name} - عکس ${selectedIndex + 1}`}
            className="h-full w-full object-cover"
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
              aria-label={`نمایش عکس ${index + 1}`}
              aria-current={index === selectedIndex ? "true" : "false"}
            >
              <img src={image} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}