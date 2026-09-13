import { getNewProducts } from "@/data/products";
import ProductSection from "./ProductSection";

export default function NewProducts() {
  const products = getNewProducts();

  return (
    <ProductSection
      title="محصولات جدید"
      subtitle="تازه‌ترین добавات به منوی قندک"
      products={products}
      viewAllHref="/categories/pastries"
      viewAllLabel="همه جدیدها"
    />
  );
}