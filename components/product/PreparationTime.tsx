import type { Product } from "@/types/product";

interface PreparationTimeProps {
  product: Product;
}

export default function PreparationTime({ product }: PreparationTimeProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-cream/50 p-4 border border-cream">
      <span className="text-2xl" aria-hidden="true">⏱️</span>
      <div>
        <p className="font-medium text-cocoa">زمان آماده‌سازی</p>
        <p className="text-sm text-cocoa/70">
          حدود {product.preparationHours} ساعت
        </p>
      </div>
    </div>
  );
}