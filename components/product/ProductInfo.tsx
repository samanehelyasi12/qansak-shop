import type { Product } from "@/types/product";

interface ProductInfoProps {
  product: Product;
}

export default function ProductInfo({ product }: ProductInfoProps) {
  const displayPrice = product.discountPrice || product.price;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <span className="mb-2 block text-sm font-medium text-caramel">
          {product.categorySlug}
        </span>
        <h1 className="mb-3 text-2xl font-bold text-cocoa sm:text-3xl">{product.name}</h1>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="flex flex-col">
          {product.discountPrice && (
            <span className="text-base text-cocoa/40 line-through sm:text-lg">
              {product.price.toLocaleString("fa-IR")} تومان
            </span>
          )}
          <span className="text-xl font-bold text-caramel sm:text-2xl">
            {displayPrice.toLocaleString("fa-IR")} تومان
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-caramel" aria-label={`امتیاز ${product.rating} از ۵`}>
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className={i < Math.floor(product.rating) ? "text-caramel" : "text-cream"}>
                ★
              </span>
            ))}
          </span>
          <span className="text-sm text-cocoa/60">({product.rating})</span>
        </div>
      </div>

      {!product.inStock && (
        <div className="rounded-lg bg-berry/10 p-4 text-center font-medium text-berry">
          در حال حاضر ناموجود است
        </div>
      )}
    </div>
  );
}