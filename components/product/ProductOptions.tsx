"use client";

import type { Product } from "@/types/product";
import { useRef } from "react";
import type { KeyboardEvent } from "react";

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
  // برای مدیریت فوکوس در الگوی radiogroup (الگوی استاندارد WAI-ARIA).
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  if (!product.options || product.options.length === 0) {
    return null;
  }

  /**
   * کیبورد استاندارد radiogroup:
   * در چیدمان RTL، فلش چپ «بعدی» و فلش راست «قبلی» است.
   * فقط یک دکمه در چرخهٔ Tab قرار می‌گیرد (roving tabindex).
   */
  const handleGroupKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    optionId: string,
    values: { id: string }[],
  ) => {
    const currentIndex = values.findIndex(
      (value) => value.id === selectedOptions[optionId],
    );
    // اگر هنوز چیزی انتخاب نشده، از دکمه‌ای که فوکوس دارد شروع می‌کنیم.
    const activeIndex = currentIndex === -1 ? 0 : currentIndex;
    let nextIndex: number | null = null;

    switch (event.key) {
      case "ArrowLeft":
        nextIndex = (activeIndex + 1) % values.length;
        break;
      case "ArrowRight":
        nextIndex = (activeIndex - 1 + values.length) % values.length;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = values.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    const nextValueId = values[nextIndex].id;
    onOptionChange(optionId, nextValueId);
    buttonRefs.current[`${optionId}:${nextValueId}`]?.focus();
  };

  return (
    <div className="space-y-4 border-t border-cream pt-6">
      {product.options.map((option) => {
        const selectedValueId = selectedOptions[option.id];
        const selectedIndex = option.values.findIndex(
          (value) => value.id === selectedValueId,
        );
        // اگر هیچ گزینه‌ای انتخاب نشده باشد، اولین دکمه در چرخهٔ Tab می‌ماند.
        const tabStopIndex = selectedIndex === -1 ? 0 : selectedIndex;
        const labelId = `product-option-label-${option.id}`;

        return (
          <div key={option.id} className="space-y-2">
            {/* قبلاً <label> بدون htmlFor و بدون کنترل دربرگرفته بود. */}
            <span id={labelId} className="block font-medium text-cocoa">
              {option.label}
            </span>
            <div
              className="flex flex-wrap gap-2"
              role="radiogroup"
              aria-labelledby={labelId}
            >
              {option.values.map((value, valueIndex) => (
                <button
                  key={value.id}
                  type="button"
                  ref={(node) => {
                    buttonRefs.current[`${option.id}:${value.id}`] = node;
                  }}
                  tabIndex={valueIndex === tabStopIndex ? 0 : -1}
                  onClick={() => onOptionChange(option.id, value.id)}
                  onKeyDown={(event) => handleGroupKeyDown(event, option.id, option.values)}
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
        );
      })}
    </div>
  );
}
