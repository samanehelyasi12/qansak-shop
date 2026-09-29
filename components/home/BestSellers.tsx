import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";
import { serverCatalog } from "@/lib/api/catalog";
import ProductSlider3D from "@/components/product/ProductSlider3D";
import BlobBackground from "@/components/BlobBackground";
import ScrollReveal from "@/components/ui/ScrollReveal";

export default async function BestSellers() {
  const products = await serverCatalog.bestSellers();

  return (
    <section className="relative overflow-hidden py-16">
      <BlobBackground />
      <Container>
        <SectionHeader
          title="محصولات قندک"
          actionLabel="مشاهده همه"
          actionHref="/products"
        />

        <ScrollReveal>
          <ProductSlider3D products={products} />
        </ScrollReveal>
      </Container>
    </section>
  );
}
