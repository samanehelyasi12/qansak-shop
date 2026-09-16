import { Metadata } from "next";
import { getAllCategories } from "@/data/categories";
import { getProductsByCategory } from "@/data/products";
import ProductCard from "@/components/product/ProductCard";
import Container from "@/components/ui/Container";
import type { Product } from "@/types/product";

export const metadata: Metadata = {
  title: "فروشگاه | قندک",
  description: "تمام محصولات قندک شامل کیک، شیرینی، نان و شکلات دست‌ساز",
};

export default function ProductsPage() {
  const categories = getAllCategories();

  const productMap = new Map<string, Product>();
  categories.forEach((category) => {
    getProductsByCategory(category.slug).forEach((product) => {
      productMap.set(product.id, product);
    });
  });

  const products = Array.from(productMap.values());

  return (
    <div className="py-12">
      <Container>
        <header className="mb-10 text-center">
          <h1 className="mb-3 text-3xl font-bold text-cocoa sm:text-4xl">
            فروشگاه
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-cocoa/70">
            تمام محصولات قندک را از بین کیک، شیرینی، نان و شکلات دست‌ساز پیدا کنید
          </p>
        </header>

        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-cocoa/60">
            <p>محصولی یافت نشد</p>
          </div>
        )}
      </Container>
    </div>
  );
}