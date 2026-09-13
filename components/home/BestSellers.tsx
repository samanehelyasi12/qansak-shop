import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";
import { getBestSellers } from "@/data/products";
import ProductCard from "@/components/product/ProductCard";
import ProductSlider3D from "@/components/product/ProductSlider3D";

export default function BestSellers() {
  const products = getBestSellers();

  return (
    <section className="py-16 bg-white">
      <Container>
        <SectionHeader
          title="محصولات قندک"
          subtitle="بهترین‌های ما، مستقیم به دستت می‌رسه"
          actionLabel="مشاهده همه"
          actionHref="/products"
        />

       
        <ProductSlider3D products={products} />
      </Container>
    </section>
  );
}