import type { Product } from "@/types/product";

interface ProductInfoProps {
  product: Product;
}

export default function ProductInfo({ product }: ProductInfoProps) {
  const displayPrice = product.discountPrice || product.price;

  return (
    <div className="space-y-6">
      <div>
        <span className="mb-2 block text-sm font-medium text-caramel">
          {product.categorySlug}
        </span>
        <h1 className="mb-3 text-3xl font-bold text-cocoa">{product.name}</h1>
        <p className="text-lg text-cocoa/80">{product.description}</p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex flex-col">
          {product.discountPrice && (
            <span className="text-lg text-cocoa/40 line-through">
              {product.price.toLocaleString("fa-IR")} تومان
            </span>
          )}
          <span className="text-2xl font-bold text-caramel">
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
          <span className="text-sm text-cocoa/60">
            ({product.rating})
          </span>
        </div>
      </div>

      {!product.inStock && (
        <div className="rounded-lg bg-berry/10 p-4 text-center text-berry font-medium">
          در حال حاضر ناموجود است
        </div>
      )}
    </div>
  );
}