"use client";

import type { Product } from "@/types/product";
import { useState } from "react";
import Button from "@/components/ui/Button";
import { getLineTotal, getUnitPrice } from "@/lib/pricing";

interface AddToCartProps {
  product: Product;
  selectedOptions: Record<string, string>;
  onAddToCart: (product: Product, options: Record<string, string>, quantity: number) => void;
  disabled?: boolean;
}

export default function AddToCart({
  product,
  selectedOptions,
  onAddToCart,
  disabled = false,
}: AddToCartProps) {
  const [quantity, setQuantity] = useState(1);

  // عملیات افزودن به سبد کاملاً محلی و همگام است، پس state بارگذاری
  // معناداری وجود ندارد و از بین بردن آن رفتار ظاهری را تغییر نمی‌دهد.
  const handleAddToCart = () => {
    onAddToCart(product, selectedOptions, quantity);
  };

  const displayPrice = getUnitPrice(product, selectedOptions);
  const totalPrice = getLineTotal(product, selectedOptions, quantity);

  return (
    <div className="space-y-4 border-t border-cream pt-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 border border-cream rounded-lg">
          <button
            type="button"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={quantity <= 1 || disabled}
            className="px-4 py-2 text-cocoa hover:bg-cream disabled:opacity-50"
            aria-label="کم کردن تعداد"
          >
            −
          </button>
          <span className="w-12 text-center text-lg font-medium text-cocoa">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity(quantity + 1)}
            disabled={disabled}
            className="px-4 py-2 text-cocoa hover:bg-cream disabled:opacity-50"
            aria-label="افزایش تعداد"
          >
            +
          </button>
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm text-cocoa/60">قیمت واحد</p>
          <p className="font-bold text-caramel">
            {displayPrice.toLocaleString("fa-IR")} تومان
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-cream pt-4">
        <div>
          <p className="text-sm text-cocoa/60">مجموع</p>
          <p className="text-xl font-bold text-caramel">
            {totalPrice.toLocaleString("fa-IR")} تومان
          </p>
        </div>
        <Button
          size="lg"
          className="w-full sm:w-auto"
          onClick={handleAddToCart}
          disabled={disabled || !product.inStock}
        >
          {product.inStock ? "افزودن به سبد" : "ناموجود"}
        </Button>
      </div>
    </div>
  );
}