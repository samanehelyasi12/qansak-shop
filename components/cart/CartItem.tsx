"use client";

import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/types/product";

interface CartItemProps {
  product: Product;
  quantity: number;
  selectedOptions: Record<string, string>;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
}

export default function CartItem({
  product,
  quantity,
  selectedOptions,
  onQuantityChange,
  onRemove,
}: CartItemProps) {
  const displayPrice = product.discountPrice || product.price;

  return (
    <article className="flex gap-4 rounded-xl border border-cream bg-white p-4 shadow-sm">
      <Link href={`/products/${product.slug}`} className="flex-shrink-0">
        <Image
          src={product.images[0]}
          alt={product.name}
          width={96}
          height={96}
          sizes="96px"
          className="h-24 w-24 object-cover rounded-lg"
        />
      </Link>
      <div className="flex-1 min-w-0">
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-medium text-cocoa truncate">{product.name}</h3>
        </Link>
        {Object.entries(selectedOptions).map(([key, value]) => (
          <p key={key} className="text-xs text-cocoa/60">
            {key}: {value}
          </p>
        ))}
        <div className="mt-2 flex items-center gap-4">
          <div className="flex items-center gap-2 border border-cream rounded-lg">
            <button
              type="button"
              onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
              className="px-3 py-1 text-cocoa hover:bg-cream"
              aria-label={`کاهش تعداد ${product.name}`}
            >
              −
            </button>
            <span className="w-8 text-center text-cocoa" aria-live="polite" aria-atomic="true">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => onQuantityChange(quantity + 1)}
              className="px-3 py-1 text-cocoa hover:bg-cream"
              aria-label={`افزایش تعداد ${product.name}`}
            >
              +
            </button>
          </div>
          <span className="font-bold text-caramel">
            {(displayPrice * quantity).toLocaleString("fa-IR")} تومان
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="flex-shrink-0 text-cocoa/50 hover:text-berry"
        aria-label={`حذف ${product.name} از سبد`}
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </article>
  );
}