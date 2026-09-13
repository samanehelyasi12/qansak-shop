"use client";

import type { Product } from "@/types/product";
import { useState } from "react";

interface ProductGalleryProps {
  product: Product;
}

export default function ProductGallery({ product }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-cream">
        <img
          src={product.images[selectedIndex]}
          alt={`${product.name} - عکس ${selectedIndex + 1}`}
          className="h-full w-full object-cover"
        />
      </div>
      {product.images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {product.images.map((image, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setSelectedIndex(index)}
              className={`flex-shrink-0 h-20 w-20 rounded-lg overflow-hidden border-2 transition ${
                index === selectedIndex
                  ? "border-caramel"
                  : "border-cream hover:border-caramel/50"
              }`}
              aria-label={`نمایش عکس ${index + 1}`}
              aria-current={index === selectedIndex ? "true" : "false"}
            >
              <img
                src={image}
                alt=""
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}