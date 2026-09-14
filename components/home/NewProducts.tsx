import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";
import { getNewProducts } from "@/data/products";
import ProductCardStack from "@/components/product/ProductCardStack";
import ScrollReveal from "@/components/ui/ScrollReveal";
import CurvedBottomBackground from "./CurvedBottomBackground";

export default function NewProducts() {
  const products = getNewProducts();

  if (products.length === 0) return null;

  return (
    <section className="relative overflow-hidden py-16">
      <CurvedBottomBackground />
      <Container>
        <SectionHeader
          title="محصولات جدید"
          subtitle="تازه‌ترین‌های قندک رو از دست نده"
          actionLabel="مشاهده همه"
          actionHref="/products"
        />

        <ScrollReveal>
          <ProductCardStack products={products} />
        </ScrollReveal>
      </Container>
    </section>
  );
}