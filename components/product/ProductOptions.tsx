"use client";

import type { Product, ProductOption, ProductOptionValue } from "@/types/product";
import { useState } from "react";

interface ProductOptionsProps {
  product: Product;
  onOptionChange: (optionId: string, valueId: string) => void;
  selectedOptions: Record<string, string>;
}

export default function ProductOptions({
  product,
  onOptionChange,
  selectedOptions,
}: ProductOptionsProps) {
  if (!product.options || product.options.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 border-t border-cream pt-6">
      {product.options.map((option: ProductOption) => (
        <div key={option.id} className="space-y-2">
          <label className="block font-medium text-cocoa">{option.label}</label>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={option.label}>
            {option.values.map((value: ProductOptionValue) => (
              <button
                key={value.id}
                type="button"
                onClick={() => onOptionChange(option.id, value.id)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${
                  selectedOptions[option.id] === value.id
                    ? "border-caramel bg-caramel text-white"
                    : "border-cream text-cocoa hover:bg-cream"
                }`}
                role="radio"
                aria-checked={selectedOptions[option.id] === value.id}
              >
                {value.label}
                {value.priceDelta > 0 && (
                  <span className="ml-2 text-xs text-caramel/80">
                    +{value.priceDelta.toLocaleString("fa-IR")}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}