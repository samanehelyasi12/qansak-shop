import { Metadata } from "next";
import { getAllCategories } from "@/data/categories";
import { getProductsByCategory } from "@/data/products";
import ProductsGrid from "@/components/product/ProductsGrid";
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
    <section
      className="relative min-h-screen bg-cover bg-center bg-no-repeat py-16"
      style={{
        backgroundImage: `url('/images/decor/products-bg-desktop.webp')`,
        backgroundAttachment: "fixed",
      }}
    >
      {/* پس‌زمینه برای موبایل */}
      <style>{`
        @media (max-width: 1023px) {
          section {
            background-image: url('/images/decor/products-bg-mobile.webp') !important;
            background-attachment: scroll;
          }
        }
      `}</style>

      {/* Overlay نیمه‌شفاف برای خوانایی بهتر متن */}
      <div className="absolute inset-0 bg-white/5"></div>

      <Container>
        <div className="relative z-10">
          <header className="mb-12 text-center">
            <h1 className="mb-3 text-2xl font-bold text-cocoa sm:text-3xl lg:text-4xl xl:text-5xl">
              فروشگاه
            </h1>
            <p className="mx-auto max-w-2xl text-xs text-cocoa/70 sm:text-sm lg:text-lg"></p>
          </header>

          {products.length > 0 ? (
            <ProductsGrid products={products} />
          ) : (
            <div className="py-12 text-center text-cocoa/60">
              <p>محصولی یافت نشد</p>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
